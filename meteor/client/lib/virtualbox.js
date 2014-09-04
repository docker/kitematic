var fs = require('fs');
var exec = require('exec');
var path = require('path');

VirtualBox = {};

VirtualBox.REQUIRED_VERSION = '4.3.14';
VirtualBox.INCLUDED_VERSION = '4.3.14';
VirtualBox.INSTALLER_FILENAME = 'virtualbox-4.3.14.pkg';

// Info for the hostonly interface we add to the VM.
VirtualBox.HOSTONLY_HOSTIP = '192.168.60.3';
VirtualBox.HOSTONLY_NETWORKMASK = '255.255.255.0';

VirtualBox.installed = function () {
  return fs.existsSync('/usr/bin/VBoxManage');
};

VirtualBox.exec = function (command, callback) {
  exec('/usr/bin/VBoxManage ' + command, function (error, stdout, stderr) {
    callback(error, stdout, stderr);
  });
};

VirtualBox.install = function (callback) {
  // -W waits for the process to close before finishing.
  exec('open -W ' + path.join(Util.getBinDir(), this.INSTALLER_FILENAME), function (error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if (error) {
      callback(error);
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
  this.exec('-v', function (err, stdout, stderr) {
    if (err) {
      callback(err);
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

VirtualBox.hostOnlyIfs = function (callback) {
  this.exec('list hostonlyifs', function (err, stdout, stderr) {
    if (err) {
      callback(err);
      return;
    }
    var lines = stdout.split('\n');
    var hostOnlyIfs = {};
    var currentIf = null;
    _.each(lines, function (line) {
      if (!line.length) {
        return;
      }
      var pieces = line.split(':');
      var key = pieces[0].trim();
      var value = pieces[1] ? pieces[1].trim() : null;
      if (key === 'Name') {
        currentIf = value;
        hostOnlyIfs[value] = {};
      }
      hostOnlyIfs[currentIf][key] = value;
    });
    callback(null, hostOnlyIfs);
  });
};

VirtualBox.hostOnlyAdapters = function (vm, callback) {
  this.exec('showvminfo ' + vm + ' --machinereadable', function (err, stdout, stderr) {
    if (err) {
      callback(err);
      return;
    }
    var matches = stdout.match(/(hostonlyadapter\d+)="(vboxnet\d+)"/g);
    if (!matches.length) {
      callback(null, {});
    } else {
      var objs = {};
      _.each(matches, function (match) {
        var pieces = match.split('=');
        objs[pieces[0]] = pieces[1].replace(/"/g, '');
      });
      callback(null, objs);
    }
  });
};

VirtualBox.hostOnlyAdapter = function (callback) {
  var self = this;
  self.hostOnlyIfs(function (err, ifs) {
    var iface = _.findWhere(_.toArray(ifs), {IPAddress: VirtualBox.HOSTONLY_HOSTIP});
    if (!iface) {
      self.exec('hostonlyif create', function (err, stdout, stderr) {
        var match = stdout.match(/Interface '(vboxnet\d+)' was successfully created/);
        if (!match) {
          callback('Could not parse output of hostonlyif create');
          return;
        }
        self.exec('hostonlyif ipconfig ' + match[1] + ' --ip ' + VirtualBox.HOSTONLY_HOSTIP + ' --netmask ' + VirtualBox.HOSTONLY_NETWORKMASK, function(err, stdout, stderr) {
          if (err) { callback(err); return; }
          callback(null, match[1]);
        });
      });
    } else {
      callback(null, iface.Name);
    }
  });
};

VirtualBox.addCustomHostAdapter = function (vm, callback) {
  var self = this;
  self.hostOnlyAdapter(function (err, ifname) {
    if (err) { callback(err); return; }
    self.exec('modifyvm ' + vm + ' --nic3 hostonly --nictype3 virtio --cableconnected3 on --hostonlyadapter3 ' + ifname, function (err, stdout, stderr) {
      callback(err, ifname);
    });
  });
};

VirtualBox.setupRouting = function (vm, callback) {
  // Get the host only adapter or create it if it doesn't exist
  this.addCustomHostAdapter(vm, function (err, ifname) {
    var installFile = path.join(Util.getBinDir(), 'install');
    var cocoaSudo = path.join(Util.getBinDir(), 'cocoasudo');
    var execCommand = cocoaSudo + ' --prompt="Kitematic needs your password to allow routing *.kite requests to containers." ' + installFile;
    exec(execCommand, {env: {IFNAME: ifname, GATEWAY: Boot2Docker.REQUIRED_IP}}, function (error, stdout, stderr) {
      if (error) {
        callback(error);
        return;
      }
      callback();
    });
  });
};

VirtualBox.removeDHCP = function (callback) {
  var self = this;
  self.hostOnlyAdapter(function (err, ifname) {
    if (err) { callback(err); return; }
    self.exec('dhcpserver remove --ifname ' + ifname, function (err, stdout, stderr) {
      callback(err);
    });
  });
};
