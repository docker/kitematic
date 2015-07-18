import fs from 'fs';
import util from './Util';
import Promise from 'bluebird';

var VirtualBox = {
  command: function () {
    if(util.isWindows()) {
      return 'C:\\Program Files\\Oracle\\VirtualBox\\VBoxManage.exe';
    } else {
      return '/Applications/VirtualBox.app/Contents/MacOS/VBoxManage';
    }
  },
  filename: function () {
    return util.isWindows() ? util.packagejson()['virtualbox-filename-win'] : util.packagejson()['virtualbox-filename'];
  },
  checksum: function () {
    return util.isWindows() ? util.packagejson()['virtualbox-checksum-win'] : util.packagejson()['virtualbox-checksum'];
  },
  url: function () {
    return `https://github.com/kitematic/virtualbox/releases/download/${util.packagejson()['virtualbox-version']}/${this.filename()}`;
  },
  installed: function () {
    if(util.isWindows()) {
      return fs.existsSync('C:\\Program Files\\Oracle\\VirtualBox\\VBoxManage.exe') && fs.existsSync('C:\\Program Files\\Oracle\\VirtualBox\\VirtualBox.exe');
    } else {
      return fs.existsSync('/Applications/VirtualBox.app') && fs.existsSync('/Applications/VirtualBox.app/Contents/MacOS/VBoxManage');
    }
  },
  active: function () {
    return fs.existsSync('/dev/vboxnetctl');
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
