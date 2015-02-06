var fs = require('fs');
var util = require('./Util');
var Promise = require('bluebird');

var VirtualBox = {
  command: function () {
    return '/usr/bin/VBoxManage';
  },
  installed: function () {
    return fs.existsSync('/usr/bin/VBoxManage') && fs.existsSync('/Applications/VirtualBox.app/Contents/MacOS/VirtualBox');
  },
  version: function () {
    if (!this.installed()) {
      return Promise.reject('VirtualBox not installed.');
    }
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
  kill: function () {
    if (!this.installed()) {
      return Promise.reject('VirtualBox not installed.');
    }
    return this.poweroffall().then(() => {
      return util.exec(['pkill', 'VirtualBox']);
    }).then(() => {
      return util.exec(['pkill', 'VBox']);
    });
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
  },
  vmdestroy: function (name) {
    if (!this.installed()) {
      throw Promise.reject('VirtualBox not installed.');
    }
    return util.exec([this.command(), 'controlvm', name, 'poweroff']).then(() => {
      return util.exec([this.command(), 'unregistervm', name, '--delete']).then(() => {
        return true;
      });
    }).catch(() => {
      return false;
    });
  }
};

module.exports = VirtualBox;
