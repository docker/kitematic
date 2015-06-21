var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var machine = require('../../utils/DockerMachineUtil');
var setupUtil = require('../../utils/SetupUtil');
var util = require('../../utils/Util');
var SetupStore = require('../SetupStore.js')

var _currentStep = null;
var _error = null;
var _cancelled = false;
var _retryPromise = null;
var _requiredSteps = [];

var _steps = [{
  name: 'download',
  title: 'Downloading VMWare Fusion',
  message: 'VMWare Fusion is being downloaded. You have selected the VMWare Fusion driver.',
  totalPercent: 35,
  percent: 0,
  run: function (progressCallback) {
    return setupUtil.download(virtualBox.url(), path.join(util.supportDir(), virtualBox.filename()), virtualBox.checksum(), percent => {
      progressCallback(percent);
    });
  }
}, {
  name: 'install',
  title: 'Installing VMWare Fusion',
  message: 'VMWare Fusion is being installed or upgraded in the background. We may need you to type in your password to continue.',
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
  message: 'To run Docker containers on VirtualBox locally, Kitematic is starting a Linux virtual machine in VirtualBox. This may take a minute...',
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
      yield machine.create();
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
