var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var _ = require('underscore');
var path = require('path');
var Promise = require('bluebird');
var boot2docker = require('./Boot2Docker');
var virtualBox = require('./VirtualBox');
var setupUtil = require('./SetupUtil');
var util = require('./Util');

var SUDO_PROMPT = 'Kitematic requires administrative privileges to install VirtualBox.';
var _currentStep = null;
var _error = null;
var _cancelled = false;

var _steps = [{
  name: 'downloadVirtualBox',
  title: 'Downloading VirtualBox',
  message: 'VirtualBox is being downloaded. Kitematic requires VirtualBox to run containers.',
  totalPercent: 35,
  percent: 0,
  run: Promise.coroutine(function* (progressCallback) {
    var packagejson = util.packagejson();
    if (virtualBox.installed()) {
      var version = yield virtualBox.version();
      if (setupUtil.compareVersions(version, packagejson['virtualbox-required-version']) >= 0) {
        return;
      }
    }
    var virtualBoxFile = `https://github.com/kitematic/virtualbox/releases/download/${packagejson['virtualbox-version']}/${packagejson['virtualbox-filename']}`;
    yield setupUtil.download(virtualBoxFile, path.join(setupUtil.supportDir(), packagejson['virtualbox-filename']), packagejson['virtualbox-checksum'], percent => {
      progressCallback(percent);
    });
  })
}, {
  name: 'installVirtualBox',
  title: 'Installing VirtualBox',
  message: "VirtualBox is being installed in the background. We may need you to type in your password to continue.",
  totalPercent: 5,
  percent: 0,
  seconds: 5,
  run: Promise.coroutine(function* () {
    var packagejson = util.packagejson();
    if (virtualBox.installed()) {
      var version = yield virtualBox.version();
      if (setupUtil.compareVersions(version, packagejson['virtualbox-required-version']) >= 0) {
        return;
      }
      yield virtualBox.killall();
    }
    var isSudo = yield setupUtil.isSudo();
    var iconPath = path.join(setupUtil.resourceDir(), 'kitematic.icns');
    var sudoCmd = isSudo ? ['sudo'] : [path.join(setupUtil.resourceDir(), 'cocoasudo'), '--icon=' + iconPath, `--prompt=${SUDO_PROMPT}`];
    sudoCmd.push.apply(sudoCmd, ['installer', '-pkg', path.join(setupUtil.supportDir(), packagejson['virtualbox-filename']), '-target', '/']);
    try {
      yield util.exec(sudoCmd);
    } catch (err) {
      _cancelled = true;
      throw err;
    }
  })
}, {
  name: 'initBoot2Docker',
  title: 'Setting up Docker VM',
  message: "To run Docker containers on your computer, we are setting up a Linux virtual machine provided by boot2docker.",
  totalPercent: 15,
  percent: 0,
  seconds: 11,
  run: Promise.coroutine(function* (progressCallback) {
    yield virtualBox.vmdestroy('kitematic-vm');
    var exists = yield boot2docker.exists();
    if (!exists) {
      setupUtil.simulateProgress(this.seconds, progressCallback);
      yield boot2docker.init();
      return;
    }

    if (!boot2docker.haskeys()) {
      throw new Error('Boot2Docker SSH keys do not exist. Fix this by removing the existing Boot2Docker VM setup and re-run the installer. This usually occurs because an old version of Boot2Docker is installed.');
    }

    var isoversion = boot2docker.isoversion();
    if (!isoversion || setupUtil.compareVersions(isoversion, boot2docker.version()) < 0) {
      setupUtil.simulateProgress(this.seconds, progressCallback);
      yield boot2docker.stop();
      yield boot2docker.upgrade();
    }
  })
}, {
  name: 'startBoot2Docker',
  title: 'Starting Docker VM',
  message: "Kitematic is starting the boot2docker VM. This may take about a minute.",
  totalPercent: 45,
  percent: 0,
  seconds: 35,
  run: function (progressCallback) {
    return boot2docker.waitstatus('saving').then(boot2docker.status).then(status => {
      setupUtil.simulateProgress(this.seconds, progressCallback);
      if (status !== 'running') {
        return boot2docker.start();
      }
    });
  }
}];

var SetupStore = assign(EventEmitter.prototype, {
  PROGRESS_EVENT: 'setup_progress',
  STEP_EVENT: 'setup_step',
  ERROR_EVENT: 'setup_error',
  step: function () {
    return _currentStep || _steps[0];
  },
  steps: function () {
    return _.indexBy(_steps, 'name');
  },
  stepCount: function () {
    return _steps.length;
  },
  number: function () {
    return _.indexOf(_steps, _currentStep) + 1;
  },
  percent: function () {
    var total = 0;
    _.each(_steps, step => {
      total += step.totalPercent * step.percent / 100;
    });
    return Math.min(Math.round(total), 99);
  },
  error: function () {
    return _error;
  },
  cancelled: function () {
    return _cancelled;
  },
  run: Promise.coroutine(function* () {
    _error = null;
    _cancelled = false;
    var steps = _currentStep ? _steps.slice(_steps.indexOf(_currentStep)) : _steps;
    for (let step of steps) {
      _currentStep = step;
      step.percent = 0;
      try {
        console.log(step.name);
        this.emit(this.STEP_EVENT);
        yield step.run(percent => {
          if (_currentStep) {
            step.percent = percent;
            this.emit(this.PROGRESS_EVENT);
          }
        });
        step.percent = 100;
      } catch (err) {
        console.log(err.stack);
        _error = err;
        this.emit(this.ERROR_EVENT);
        throw err;
      }
    }
  })
});

module.exports = SetupStore;
