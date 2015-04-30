var fs = require('fs');
var util = require('./Util');
var Promise = require('bluebird');

var VirtualBox = {
  command: function () {
    if(util.isWindows()) {
      return 'C:\\Program Files\\Oracle\\VirtualBox\\VBoxManage.exe';
    } else {
      return '/usr/bin/VBoxManage';
    }
  },
  filename: function () {
    return util.isWindows() ? util.packagejson()['virtualbox-filename-win'] : util.packagejson()['virtualbox-filename'];
  },
  checksum: function () {
    return util.isWindows() ? util.packagejson()['virtualbox-checksum-win'] : util.packagejson()['virtualbox-checksum'];
  },
  url: function () {
    if(util.isWindows()) {
      return 'http://download.virtualbox.org/virtualbox/4.3.26/VirtualBox-4.3.26-98988-Win.exe';
    } else {
      return `https://github.com/kitematic/virtualbox/releases/download/${util.packagejson()['virtualbox-version']}/${this.virtualBoxFileName()}`;
    }
  },
  installed: function () {
    if(util.isWindows()) {
      return fs.existsSync('C:\\Program Files\\Oracle\\VirtualBox\\VBoxManage.exe') && fs.existsSync('C:\\Program Files\\Oracle\\VirtualBox\\VirtualBox.exe');
    } else {
      return fs.existsSync('/usr/bin/VBoxManage') && fs.existsSync('/Applications/VirtualBox.app');
    }
  },
  version: function () {
    return new Promise((resolve, reject) => {
      util.exec([this.command(), '-v']).then(stdout => {
        var match = stdout.match(/(\d+\.\d+\.\d+).*/);
        if (!match || match.length < 2) {
          reject('VBoxManage -v output format not recognized.');
        }
        resolve(match[1]);
      }).catch(reject);
    });
  },
  poweroffall: function () {
    if (!this.installed()) {
      return Promise.reject('VirtualBox not installed.');
    }
    return util.exec(this.command() + ' list runningvms | sed -E \'s/.*\\{(.*)\\}/\\1/\' | xargs -L1 -I {} ' + this.command() + ' controlvm {} poweroff');
  },
  mountSharedDir: function (vmName, pathName, hostPath) {
    if (!this.installed()) {
      return Promise.reject('VirtualBox not installed.');
    }

    return util.exec([this.command(), 'sharedfolder', 'add', vmName, '--name', pathName, '--hostpath', hostPath, '--automount']);
  },
  killall: function () {
    if(util.isWindows()) {
      return this.poweroffall().then(() => {
        return util.exec(['powershell.exe', '\"get-process VBox* | stop-process\"']);
      }).catch(() => {});
    } else {
      return this.poweroffall().then(() => {
        return util.exec(['pkill', 'VirtualBox']);
      }).then(() => {
        return util.exec(['pkill', 'VBox']);
      }).catch(() => {

      });
    }
  },
  vmstate: function (name) {
    return new Promise((resolve, reject) => {
      util.exec([this.command(), 'showvminfo', name, '--machinereadable']).then(stdout => {
        var match = stdout.match(/VMState="(\w+)"/);
        if (!match) {
          reject('Could not parse VMState');
        }
        resolve(match[1]);
      }).catch(reject);
    });
  }
};

module.exports = VirtualBox;
