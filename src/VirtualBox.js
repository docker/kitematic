var fs = require('fs');
var util = require('./Util');
var Promise = require('bluebird');

var VirtualBox = {
  command: function () {
    return '/usr/bin/VBoxManage';
  },
  installed: function () {
    return fs.existsSync('/usr/bin/VBoxManage') && fs.existsSync('/Applications/VirtualBox.app');
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
  killall: function () {
    return this.poweroffall().then(() => {
      return util.exec(['pkill', 'VirtualBox']);
    }).then(() => {
      return util.exec(['pkill', 'VBox']);
    }).catch(err => {
      
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
    return Promise.coroutine(function* () {
      if (!this.installed()) {
        return Promise.reject('VirtualBox not installed.');
      }
      try {
        var state = yield this.vmstate(name);
        if (state === 'running') {
          yield util.exec([this.command(), 'controlvm', name, 'poweroff']);
        }
        yield util.exec([this.command(), 'unregistervm', name, '--delete']);
      } catch (err) {}
    }.bind(this))();
  }
};

module.exports = VirtualBox;
