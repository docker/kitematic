var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var machine = require('./DockerMachine');
var virtualBox = require('./VirtualBox');
var setupUtil = require('./SetupUtil');
var util = require('./Util');
var assign = require('object-assign');
var metrics = require('./Metrics');
var bugsnag = require('bugsnag-js');

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
    var cmd = setupUtil.copyBinariesCmd() + ' && ' + setupUtil.fixBinariesCmd();
    if (!virtualBox.installed()) {
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
  title: 'Starting Docker VM',
  message: 'To run Docker containers on your computer, Kitematic is starting a Linux virutal machine. This may take a minute...',
  totalPercent: 60,
  percent: 0,
  seconds: 52,
  run: Promise.coroutine(function* (progressCallback) {
    setupUtil.simulateProgress(this.seconds, progressCallback);
    yield virtualBox.vmdestroy('kitematic-vm');
    var exists = yield machine.exists();
    if (!exists) {
      yield machine.create();
      return;
    } else if ((yield machine.state()) === 'Error') {
      try {
        yield machine.rm();
      } catch (err) {}
      yield machine.create();
      return;
    }

    var isoversion = machine.isoversion();
    var packagejson = util.packagejson();
    if (!isoversion || setupUtil.compareVersions(isoversion, packagejson['docker-version']) < 0) {
      console.log('upgrading');
      yield machine.stop();
      yield machine.upgrade();
    }
    yield machine.start();
  })
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
    var isoversion = machine.isoversion();
    var required = {};
    var vboxfile = path.join(util.supportDir(), packagejson['virtualbox-filename']);
    required.download = !virtualBox.installed() && (!fs.existsSync(vboxfile) || setupUtil.checksum(vboxfile) !== packagejson['virtualbox-checksum']);
    required.install = !virtualBox.installed() || setupUtil.needsBinaryFix();
    required.init = !(yield machine.exists()) || (yield machine.state()) !== 'Running' || !isoversion || setupUtil.compareVersions(isoversion, packagejson['docker-version']) < 0;

    var exists = yield machine.exists();
    if (isoversion && setupUtil.compareVersions(isoversion, packagejson['docker-version']) < 0) {
      this.steps().init.seconds = 33;
    } else if (exists && (yield machine.state()) !== 'Error') {
      this.steps().init.seconds = 13;
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
      return util.exec(setupUtil.copyBinariesCmd());
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
          if (err) {
            console.log('Setup encountered an error.');
            console.log(err);
            console.log(err.stack);
            metrics.track('Setup Failed', {
              step: step.name
            });
            bugsnag.notify(err);
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
