var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var boot2docker = require('./Boot2Docker');
var virtualbox = require('./Virtualbox');
var setupUtil = require('./SetupUtil');
var util = require('./Util');
var packagejson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

var _percent = 0;
var _currentStep = null;
var _error = null;

var VIRTUALBOX_FILE = `http://download.virtualbox.org/virtualbox/${packagejson['virtualbox-version']}/${packagejson['virtualbox-filename']}`;
var SUDO_PROMPT = 'Kitematic requires administrative privileges to install VirtualBox and copy itself to the Applications folder.';

var SetupStore = assign(EventEmitter.prototype, {
  PROGRESS_EVENT: 'setup_progress',
  STEP_EVENT: 'setup_step',
  ERROR_EVENT: 'setup_error',
  downloadVirtualboxStep: Promise.coroutine(function* () {
    if (virtualbox.installed()) {
      var version = yield virtualbox.version();
      if (setupUtil.compareVersions(version, packagejson['virtualbox-required-version']) >= 0) {
        return;
      }
    }
    var checksum = yield setupUtil.virtualboxSHA256(packagejson['virtualbox-version'], packagejson['virtualbox-filename']);
    yield setupUtil.download(VIRTUALBOX_FILE, path.join(setupUtil.supportDir(), packagejson['virtualbox-filename']), checksum, percent => {
      _percent = percent;
      SetupStore.emit(SetupStore.PROGRESS_EVENT);
    });
  }),
  installVirtualboxStep: Promise.coroutine(function* () {
    if (virtualbox.installed()) {
      var version = yield virtualbox.version();
      if (setupUtil.compareVersions(version, packagejson['virtualbox-required-version']) >= 0) {
        return;
      }
      yield virtualbox.kill();
    }
    yield util.exec(['hdiutil', 'attach', path.join(setupUtil.supportDir(), packagejson['virtualbox-filename'])]);
    var isSudo = yield setupUtil.isSudo();
    var iconPath = path.join(setupUtil.resourceDir(), 'kitematic.icns');
    var sudoCmd = isSudo ? ['sudo'] : [path.join(setupUtil.resourceDir(), 'cocoasudo'), '--icon=' + iconPath, `--prompt=${SUDO_PROMPT}`];
    sudoCmd.push.apply(sudoCmd, ['installer', '-pkg', '/Volumes/VirtualBox/VirtualBox.pkg', '-target', '/']);
    yield util.exec(sudoCmd);
    yield util.exec(['hdiutil', 'detach', '/Volumes/VirtualBox']);
  }),
  cleanupKitematicStep: function () {
    return virtualbox.vmdestroy('kitematic-vm');
  },
  initBoot2DockerStep: Promise.coroutine(function* () {
    var exists = yield boot2docker.exists();
    if (!exists) {
      yield boot2docker.init();
      return;
    }

    if (!boot2docker.haskeys()) {
      throw new Error('Boot2Docker SSH key doesn\'t exist. Fix by removing the existing Boot2Docker VM and re-run the installer. This usually occurs because an old version of Boot2Docker is installed.');
    }

    var isoversion = yield boot2docker.isoversion();
    if (!isoversion || setupUtil.compareVersions(isoversion, boot2docker.version()) < 0) {
      yield boot2docker.stop();
      yield boot2docker.upgrade();
    }
  }),
  startBoot2DockerStep: function () {
    return boot2docker.waitstatus('saving').then(boot2docker.status).then(status => {
      if (status !== 'running') {
        return boot2docker.start();
      }
    });
  },
  step: function () {
    if (_currentStep) {
      return _currentStep;
    } else {
      return '';
    }
  },
  percent: function () {
    return _percent;
  },
  error: function () {
    return _error;
  },
  run: Promise.coroutine(function* () {
    var steps = [{
      name: 'download_virtualbox',
      run: this.downloadVirtualboxStep
    }, {
      name: 'install_virtualbox',
      run: this.installVirtualboxStep
    }, {
      name: 'cleanup_kitematic',
      run: this.cleanupKitematicStep
    }, {
      name: 'init_boot2docker',
      run: this.initBoot2DockerStep
    }, {
      name: 'start_boot2docker',
      run: this.startBoot2DockerStep
    }];

    _error = null;
    for (let step of steps) {
      console.log(step.name);
      _currentStep = step.name;
      _percent = 0;
      this.emit(this.STEP_EVENT);
      try {
        yield step.run();
      } catch (err) {
        _error = err;
        this.emit(this.ERROR_EVENT);
        throw err;
      }
    }
  })
});

module.exports = SetupStore;
