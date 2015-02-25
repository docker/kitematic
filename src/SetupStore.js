var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var boot2docker = require('./Boot2Docker');
var virtualBox = require('./VirtualBox');
var setupUtil = require('./SetupUtil');
var util = require('./Util');
var assign = require('object-assign');
var metrics = require('./Metrics');

var _currentStep = null;
var _error = null;
var _cancelled = false;
var _retryPromise = null;
var _requiredSteps = [];

var _steps = [{
  name: 'download',
  title: 'Downloading VirtualBox',
  message: 'VirtualBox is being downloaded. Kitematic requires VirtualBox to run containers.',
  totalPercent: 35,
  percent: 0,
  run: function (progressCallback) {
    var packagejson = util.packagejson();
    return setupUtil.download(setupUtil.virtualBoxUrl(), path.join(util.supportDir(), packagejson['virtualbox-filename']), packagejson['virtualbox-checksum'], percent => {
      progressCallback(percent);
    });
  }
}, {
  name: 'install',
  title: 'Installing VirtualBox & Docker',
  message: 'VirtualBox & Docker are being installed or upgraded in the background. We may need you to type in your password to continue.',
  totalPercent: 5,
  percent: 0,
  seconds: 5,
  run: Promise.coroutine(function* (progressCallback) {
    var packagejson = util.packagejson();
    var cmd = util.copyBinariesCmd() + ' && ' + util.fixBinariesCmd();
    if (!virtualBox.installed() || setupUtil.compareVersions(yield virtualBox.version(), packagejson['virtualbox-required-version']) < 0) {
      yield virtualBox.killall();
      cmd += ' && ' + setupUtil.installVirtualBoxCmd();
    } else {
      if (!setupUtil.needsBinaryFix()) {
        return;
      }
    }
    try {
      progressCallback(50); // TODO: detect when the installation has started so we can simulate progress
      yield util.exec(setupUtil.macSudoCmd(cmd));
    } catch (err) {
      throw null;
    }
  })
}, {
  name: 'init',
  title: 'Setting up Docker VM',
  message: 'To run Docker containers on your computer, we are setting up a Linux virtual machine provided by boot2docker.',
  totalPercent: 15,
  percent: 0,
  seconds: 11,
  run: Promise.coroutine(function* (progressCallback) {
    setupUtil.simulateProgress(this.seconds, progressCallback);
    yield virtualBox.vmdestroy('kitematic-vm');
    var exists = yield boot2docker.exists();
    if (!exists) {
      yield boot2docker.init();
      return;
    }

    if (!boot2docker.haskeys()) {
      throw new Error('Boot2Docker SSH keys do not exist. Fix this by removing the existing Boot2Docker VM setup and re-run the installer. This usually occurs because an old version of Boot2Docker is installed.');
    }

    var isoversion = boot2docker.isoversion();
    if (!isoversion || setupUtil.compareVersions(isoversion, boot2docker.version()) < 0) {
      yield boot2docker.stop();
      yield boot2docker.upgrade();
    }
  })
}, {
  name: 'start',
  title: 'Starting Docker VM',
  message: "Kitematic is starting the boot2docker VM. This may take about a minute.",
  totalPercent: 45,
  percent: 0,
  seconds: 35,
  run: function (progressCallback) {
    setupUtil.simulateProgress(this.seconds, progressCallback);
    return boot2docker.waitstatus('saving').then(boot2docker.status).then(status => {
      if (status !== 'running') {
        return boot2docker.start();
      }
    });
  }
}];

var SetupStore = assign(Object.create(EventEmitter.prototype), {
  PROGRESS_EVENT: 'setup_progress',
  STEP_EVENT: 'setup_step',
  ERROR_EVENT: 'setup_error',
  step: function () {
    return _currentStep;
  },
  steps: function () {
    return _.indexBy(_steps, 'name');
  },
  stepCount: function () {
    return _requiredSteps.length;
  },
  number: function () {
    return _.indexOf(_requiredSteps, _currentStep) + 1;
  },
  percent: function () {
    var sofar = 0;
    var totalPercent = _requiredSteps.reduce((prev, step) => prev + step.totalPercent, 0);
    _.each(_requiredSteps, step => {
      sofar += step.totalPercent * step.percent / 100;
    });
    return Math.min(Math.round(100 * sofar / totalPercent), 99);
  },
  error: function () {
    return _error;
  },
  cancelled: function () {
    return _cancelled;
  },
  retry: function () {
    _error = null;
    _cancelled = false;
    _retryPromise.resolve();
  },
  wait: function () {
    _retryPromise = Promise.defer();
    return _retryPromise.promise;
  },
  requiredSteps: Promise.coroutine(function* () {
    if (_requiredSteps.length) {
      return Promise.resolve(_requiredSteps);
    }
    var packagejson = util.packagejson();
    var isoversion = boot2docker.isoversion();
    var required = {};
    var vboxfile = path.join(util.supportDir(), packagejson['virtualbox-filename']);
    var vboxUpgradeRequired = setupUtil.compareVersions(yield virtualBox.version(), packagejson['virtualbox-required-version']) < 0;
    required.download = vboxUpgradeRequired || !virtualBox.installed() && (!fs.existsSync(vboxfile) || setupUtil.checksum(vboxfile) !== packagejson['virtualbox-checksum']);
    required.install = vboxUpgradeRequired || !virtualBox.installed() || setupUtil.needsBinaryFix();
    required.init = !(yield boot2docker.exists()) || !isoversion || setupUtil.compareVersions(isoversion, boot2docker.version()) < 0;
    required.start = required.install || required.init || (yield boot2docker.status()) !== 'running';

    var exists = yield boot2docker.exists();
    if (exists) {
      this.steps().start.seconds = 13;
    }

    _requiredSteps = _steps.filter(function (step) {
      return required[step.name];
    });
    return Promise.resolve(_requiredSteps);
  }),
  updateBinaries: function () {
    if (setupUtil.needsBinaryFix()) {
      return Promise.resolve();
    }
    if (setupUtil.shouldUpdateBinaries()) {
      return util.exec(util.copyBinariesCmd());
    }
    return Promise.resolve();
  },
  run: Promise.coroutine(function* () {
    metrics.track('Started Setup');
    yield this.updateBinaries();
    var steps = yield this.requiredSteps();
    for (let step of steps) {
      console.log(step.name);
      _currentStep = step;
      step.percent = 0;
      while (true) {
        try {
          this.emit(this.STEP_EVENT);
          yield step.run(percent => {
            if (_currentStep) {
              step.percent = percent;
              this.emit(this.PROGRESS_EVENT);
            }
          });
          metrics.track('Completed Step', {
            name: step.name
          });
          step.percent = 100;
          break;
        } catch (err) {
          metrics.track('Setup Failed', {
            step: step.name
          });
          console.log('Setup encountered an error.');
          console.log(err);
          if (err) {
            _error = err;
            this.emit(this.ERROR_EVENT);
          } else {
            _cancelled = true;
            this.emit(this.STEP_EVENT);
          }
          yield this.wait();
        }
      }
    }
    metrics.track('Finished Setup');
    _currentStep = null;
  })
});

module.exports = SetupStore;
