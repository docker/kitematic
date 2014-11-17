var fs = require('fs');
var exec = require('exec');
var path = require('path');

VirtualBox = {};

VirtualBox.REQUIRED_VERSION = '4.3.18';
VirtualBox.INCLUDED_VERSION = '4.3.18';
VirtualBox.INSTALLER_FILENAME = 'virtualbox-4.3.18.pkg';
VirtualBox.INSTALLER_CHECKSUM = '5836c94481c460c648b9216386591a2915293ac86b9bb6c57746637796af6af2'; // Sha256 Checksum

VirtualBox.installed = function () {
  return fs.existsSync('/usr/bin/VBoxManage') &&
    fs.existsSync('/Applications/VirtualBox.app/Contents/MacOS/VirtualBox');
};

VirtualBox.exec = function (command, callback) {
  exec('/usr/bin/VBoxManage ' + command, function (stderr, stdout, code) {
    callback(stderr, stdout, code);
  });
};

VirtualBox.install = function (callback) {
  // -W waits for the process to close before finishing.
  exec('open -W ' + path.join(Util.getResourceDir(), this.INSTALLER_FILENAME).replace(' ', '\\ '), function (stderr, stdout, code) {
    if (code) {
      callback(stderr);
      return;
    }
    callback(null);
  });
};

VirtualBox.version = function (callback) {
  if (!this.installed()) {
    callback('VirtualBox not installed.');
    return;
  }
  this.exec('-v', function (stderr, stdout, code) {
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
};

VirtualBox.shutDownRunningVMs = function (callback) {
  if (!this.installed()) {
    callback('VirtualBox not installed.');
    return;
  }
  this.exec('list runningvms | sed -E \'s/.*\\{(.*)\\}/\\1/\' | xargs -L1 -I {} VBoxManage controlvm {} savestate', function (stderr, stdout, code) {
    if (code) {
      callback(stderr);
    } else {
      callback();
    }
  });
};

VirtualBox.killAllProcesses = function (callback) {
  this.shutDownRunningVMs(function (err) {
    if (err) {callback(err); return;}
    exec('pkill VirtualBox', function (stderr, stdout, code) {
      if (code) {callback(stderr); return;}
      exec('pkill VBox', function (stderr, stdout, code) {
        if (code) {callback(stderr); return;}
        callback();
      });
    });
  });
};
