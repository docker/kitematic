import fs from 'fs';
import path from 'path';
import util from './Util';
import Promise from 'bluebird';

var VirtualBox = {
  command: function () {
    if (util.isWindows()) {
      if (process.env.VBOX_MSI_INSTALL_PATH) {
        return path.join(process.env.VBOX_MSI_INSTALL_PATH, 'VBoxManage.exe');
      } else {
        return path.join(process.env.VBOX_INSTALL_PATH, 'VBoxManage.exe');
      }
    } else {
      return '/Applications/VirtualBox.app/Contents/MacOS/VBoxManage';
    }
  },
  installed: function () {
    if (util.isWindows() && !process.env.VBOX_INSTALL_PATH && !process.env.VBOX_MSI_INSTALL_PATH) {
      return false;
    }
    return fs.existsSync(this.command());
  },
  active: function () {
    return fs.existsSync('/dev/vboxnetctl');
  },
  version: function () {
    return util.execFile([this.command(), '-v']).then(stdout => {
      let matchlist = stdout.match(/(\d+\.\d+\.\d+).*/);
      if (!matchlist || matchlist.length < 2) {
        Promise.reject('VBoxManage -v output format not recognized.');
      }
      return Promise.resolve(matchlist[1]);
    }).catch(() => {
      return Promise.resolve(null);
    });
  },
  mountSharedDir: function (vmName, pathName, hostPath) {
    return util.execFile([this.command(), 'sharedfolder', 'add', vmName, '--name', pathName, '--hostpath', hostPath, '--automount']);
  },
  vmExists: function (name) {
    return util.execFile([this.command(), 'showvminfo', name]).then(() => {
      return true;
    }).catch((err) => {
      return false;
    });
  },
  getShareDir: function (vmName) {
    var myRegexp = /Host path:\s'([^']+)'/;
    return util.execFile([this.command(), 'showvminfo', vmName]).then((value) => {
      let sharedFoldersStart = value.indexOf('Shared folders:');
      let sharedFoldersEnd = value.indexOf('VRDE Connection:');
      let vl = value.substring(sharedFoldersStart, sharedFoldersEnd);
      let items = vl.split('\n');
      var elements = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].startsWith('Name')) {
          elements.push(myRegexp.exec(items[i])[1]);
        }
      }
      util.folders = elements;
      return true;
    }).catch(() => {
      return false;
    });

  }
};

module.exports = VirtualBox;
