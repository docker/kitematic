var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var machine = require('../../utils/DockerMachineUtil');
var virtualBox = require('../../utils/VirtualBoxUtil');
var setupUtil = require('../../utils/SetupUtil');
var util = require('../../utils/Util');
var assign = require('object-assign');
var metrics = require('../../utils/MetricsUtil');
var bugsnag = require('bugsnag-js');
var docker = require('../../utils/DockerUtil');

var _currentStep = null;
var _error = null;
var _cancelled = false;
var _retryPromise = null;
var _requiredSteps = [];
var NAME = "virtualbox"

var _steps = [{
  name: 'download',
  title: 'Downloading VirtualBox',
  message: 'VirtualBox is being downloaded. You have selected the VirtualBox driver.',
  totalPercent: 35,
  percent: 0,
  run: function (progressCallback) {
    return setupUtil.download(virtualBox.url(), path.join(util.supportDir(), virtualBox.filename()), virtualBox.checksum(), percent => {
      progressCallback(percent);
    });
  }
}, {
  name: 'install',
  title: 'Installing VirtualBox',
  message: 'VirtualBox is being installed or upgraded in the background. We may need you to type in your password to continue.',
  totalPercent: 5,
  percent: 0,
  seconds: 5,
  run: Promise.coroutine(function* (progressCallback) {
    if (!virtualBox.installed()) {
      yield virtualBox.killall();
      progressCallback(50); // TODO: detect when the installation has started so we can simulate progress
      try {
        if (util.isWindows()) {
          yield util.exec([path.join(util.supportDir(), virtualBox.filename()), '-msiparams', 'REBOOT=ReallySuppress', 'LIMITUI=INSTALLUILEVEL_PROGRESSONLY']);
        } else {
          yield util.exec(setupUtil.macSudoCmd(setupUtil.installVirtualBoxCmd()));
        }
      } catch (err) {
        throw null;
      }
    } else if (!util.isWindows() && !virtualBox.active()) {
      yield util.exec(setupUtil.macSudoCmd(util.escapePath('/Library/Application Support/VirtualBox/LaunchDaemons/VirtualBoxStartup.sh') + ' restart'));
    }
  })
}, {
  name: 'init',
  title: 'Starting Docker VM',
  message: 'To run Docker containers on VirtualBox, Kitematic is starting a Linux virtual machine. This may take a minute...',
  totalPercent: 60,
  percent: 0,
  seconds: 110,
  run: Promise.coroutine(function* (progressCallback) {
    setupUtil.simulateProgress(this.seconds, progressCallback);
    var exists = yield machine.exists();
    if (!exists || (yield machine.state()) === 'Error') {
      if (exists && (yield machine.state()) === 'Error') {
        yield machine.rm();
      }
      let BOOT2DOCKER_URL = localStorage.getItem('settings.virtualbox-boot2docker-url');
      let CPU_COUNT = localStorage.getItem('settings.virtualbox-cpu-count');
      let DISK_SIZE = localStorage.getItem('settings.virtualbox-disk-size');
      let HOSTONLY_CIDR = localStorage.getItem('settings.virtualbox-hostonly-cidr');
      let MEMORY = localStorage.getItem('settings.virtualbox-memory');
      yield machine.create(NAME, ["--virtualbox-boot2docker-url", BOOT2DOCKER_URL,"--virtualbox-cpu-count", CPU_COUNT, "--virtualbox-disk-size", DISK_SIZE,  "--virtualbox-memory", MEMORY]);// This will be refactored to dynmaically get and pass flags
      return;
    }

    var isoversion = machine.isoversion();
    var packagejson = util.packagejson();
    if (!isoversion || util.compareVersions(isoversion, packagejson['docker-version']) < 0) {
      yield machine.start();
      yield machine.upgrade();
    }
    if ((yield machine.state()) !== 'Running') {
      yield machine.start();
    }
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
  retry: function (remove) {
    _error = null;
    _cancelled = false;
    if (!_retryPromise) {
      return;
    }
    this.emit(this.ERROR_EVENT);
    if (remove) {
      machine.rm().finally(() => {
        _retryPromise.resolve();
      });
    } else {
      machine.stop().finally(() => {
        _retryPromise.resolve();
      });
    }
  },
  setError: function (error) {
    _error = error;
    this.emit(this.ERROR_EVENT);
  },
  pause: function () {
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
    var vboxfile = path.join(util.supportDir(), virtualBox.filename());
    var vboxNeedsInstall = !virtualBox.installed();

    required.download = vboxNeedsInstall && (!fs.existsSync(vboxfile) || setupUtil.checksum(vboxfile) !== virtualBox.checksum());
    required.install = vboxNeedsInstall || (!util.isWindows() && !virtualBox.active());
    required.init = required.install || !(yield machine.exists()) || (yield machine.state()) !== 'Running' || !isoversion || util.compareVersions(isoversion, packagejson['docker-version']) < 0;

    var exists = yield machine.exists();
    if (isoversion && util.compareVersions(isoversion, packagejson['docker-version']) < 0) {
      this.steps().init.seconds = 33;
    } else if (exists && (yield machine.state()) === 'Saved') {
      this.steps().init.seconds = 8;
    } else if (exists && (yield machine.state()) !== 'Error') {
      this.steps().init.seconds = 23;
    }

    _requiredSteps = _steps.filter(function (step) {
      return required[step.name];
    });
    return Promise.resolve(_requiredSteps);
  }),
  run: Promise.coroutine(function* () {
    metrics.track('Started Setup', {
      virtualbox: virtualBox.installed() ? yield virtualBox.version() : 'Not Installed'
    });
    var steps = yield this.requiredSteps();
    for (let step of steps) {
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
          metrics.track('Setup Completed Step', {
            name: step.name
          });
          step.percent = 100;
          break;
        } catch (err) {
          if (err) {
            throw err;
          } else {
            metrics.track('Setup Cancelled');
            _cancelled = true;
            this.emit(this.STEP_EVENT);
          }
          yield this.pause();
        }
      }
    }
    _currentStep = null;
    return yield machine.ip();
  }),
  setup: Promise.coroutine(function * () {
    while (true) {
      try {
        var ip = yield this.run();
        if (!ip || !ip.length) {
          throw {
            message: 'Machine IP could not be fetched. Please retry the setup. If this fails please file a ticket on our GitHub repo.',
            machine: yield machine.info(),
            ip: ip
          };
        }
        docker.addClient(NAME, ip, machine.name());
        yield docker.clients[NAME].waitForConnection();
        metrics.track('Setup Finished');
        break;
      } catch (err) {
        err.message = util.removeSensitiveData(err.message);
        metrics.track('Setup Failed', {
          step: _currentStep,
        });
        console.log(err);
        bugsnag.notify('SetupError', err.message, {
          error: err,
          output: err.message
        }, 'info');
        _error = err;
        this.emit(this.ERROR_EVENT);
        yield this.pause();
      }
    }
  })
});

module.exports = SetupStore;
