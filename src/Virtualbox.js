var fs = require('fs');
var exec = require('exec');
var async = require('async');

var VirtualBox = {
  command: function () {
    return '/usr/bin/VBoxManage';
  },
  installed: function () {
    return fs.existsSync('/usr/bin/VBoxManage') && fs.existsSync('/Applications/VirtualBox.app/Contents/MacOS/VirtualBox');
  },
  version: function (callback) {
    if (!this.installed()) {
      callback('VirtualBox not installed.');
      return;
    }
    exec([this.command(), '-v'], function (stderr, stdout, code) {
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
  poweroff: function (callback) {
    if (!this.installed()) {
      callback('VirtualBox not installed.');
      return;
    }
    exec(this.command() + ' list runningvms | sed -E \'s/.*\\{(.*)\\}/\\1/\' | xargs -L1 -I {} ' + this.command() + ' controlvm {} acpipowerbutton', function (stderr, stdout, code) {
      if (code) {
        callback(stderr);
      } else {
        callback();
      }
    });
  },
  kill: function (callback) {
    this.poweroff(function (err) {
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
  vmstate: function (name, callback) {
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
  vmdestroy: function (name, callback) {
    var self = this;
    this.vmstate(name, function (err) {
      // No VM found
      if (err) { callback(null, false); return; }
      exec('/usr/bin/VBoxManage controlvm ' + name + ' acpipowerbutton', function (stderr, stdout, code) {
        if (code) { callback(stderr, false); return; }
        var state = null;

        async.until(function () {
          return state === 'poweroff';
        }, function (callback) {
          self.vmstate(name, function (err, newState) {
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
