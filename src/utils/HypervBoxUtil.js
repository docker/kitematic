import fs from 'fs';
import path from 'path';
import util from './Util';
import Promise from 'bluebird';

var HypervBox = {
  command: function () {
    if (util.isWindows()) {
        if (HypervBox.pathExists())
        {
            return "c:\windows\system32\vmms.exe";
        }
    }
     
    return "";
  },
  pathExists: function (){
    let hypervPath = "c:\windows\system32\vmms.exe";

    try {
        fs.accessSync(hypervPath, fs.F_OK);
        
        return true;
    } catch (e) {
        return false;
    }
  },
  installed: function () {
    if (util.isWindows() && !HypervBox.pathExists()) {
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
    return util.execFile([this.command(), 'list', 'vms']).then(out => {
      return out.indexOf('"' + name + '"') !== -1;
    }).catch(() => {
      return false;
    });
  }
};

module.exports = HypervBox;
