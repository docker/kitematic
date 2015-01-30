var fs = require('fs');
var exec = require('exec');
var path = require('path');
var async = require('async');
var util = require('./util');

var VirtualBox = {
  REQUIRED_VERSION: '4.3.18',
  INCLUDED_VERSION: '4.3.18',
  INSTALLER_FILENAME: 'virtualbox-4.3.18.pkg',
  INSTALLER_CHECKSUM: '5836c94481c460c648b9216386591a2915293ac86b9bb6c57746637796af6af2',
  command: function () {
    return '/usr/bin/VBoxManage';
  },
  installed: function () {
    return fs.existsSync('/usr/bin/VBoxManage') && fs.existsSync('/Applications/VirtualBox.app/Contents/MacOS/VirtualBox');
  },
  install: function (callback) {
    // -W waits for the process to close before finishing.
    exec('open -W ' + path.join(util.supportDir(), this.INSTALLER_FILENAME).replace(' ', '\\ '), function (stderr, stdout, code) {
      if (code) {
        callback(stderr);
        return;
      }
      callback(null);
    });
  },
  version: function (callback) {
    if (!this.installed()) {
      callback('VirtualBox not installed.');
      return;
    }
    exec('/usr/bin/VBoxManage -v', function (stderr, stdout, code) {
      if (code) {
        callback(stderr);
        return;
      }
      // Output is x.x.xryyyyyy
      var match = stdout.match(/(\d+\.\d+\.\d+).*/);
      if (!match || match.length < 2) {
        callback('VBoxManage -v output format not recognized.');
        return;
      }
      callback(null, match[1]);
    });
  },
  saveVMs: function (callback) {
    if (!this.installed()) {
      callback('VirtualBox not installed.');
      return;
    }
    exec('/usr/bin/VBoxManage list runningvms | sed -E \'s/.*\\{(.*)\\}/\\1/\' | xargs -L1 -I {} /usr/bin/VBoxManage controlvm {} savestate', function (stderr, stdout, code) {
      if (code) {
        callback(stderr);
      } else {
        callback();
      }
    });
  },
  kill: function (callback) {
    this.saveRunningVMs(function (err) {
      if (err) {callback(err); return;}
      exec('pkill VirtualBox', function (stderr, stdout, code) {
        if (code) {callback(stderr); return;}
        exec('pkill VBox', function (stderr, stdout, code) {
          if (code) {callback(stderr); return;}
          callback();
        });
      });
    });
  },
  vmState: function (name, callback) {
    exec(this.command() + ' showvminfo ' + name + ' --machinereadable', function (stderr, stdout, code) {
      if (code) { callback(stderr); return; }
      var match = stdout.match(/VMState="(\w+)"/);
      if (!match) {
        callback('Could not parse VMState');
        return;
      }
      callback(null, match[1]);
    });
  },
  deleteVM:function (name, callback) {
    VirtualBox.vmState(name, function (err, state) {
      // No VM found
      if (err) { callback(null, false); return; }
      exec('/usr/bin/VBoxManage controlvm ' + name + ' acpipowerbutton', function (stderr, stdout, code) {
        if (code) { callback(stderr, false); return; }
        var state = null;

        async.until(function () {
          return state === 'poweroff';
        }, function (callback) {
          VirtualBox.vmState(name, function (err, newState) {
            if (err) { callback(err); return; }
            state = newState;
            setTimeout(callback, 250);
          });
        }, function (err) {
          exec('/usr/bin/VBoxManage unregistervm ' + name + ' --delete', function (stderr, stdout, code) {
            if (code) { callback(err); return; }
            callback();
          });
        });
      });
    });
  }
};

module.exports = VirtualBox;
