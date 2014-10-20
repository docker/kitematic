var exec = require('exec');
var path = require('path');
var fs = require('fs');

Boot2Docker = {};

Boot2Docker.REQUIRED_IP = '192.168.60.103';

Boot2Docker.command = function () {
  return path.join(Util.getBinDir(), 'boot2docker-1.3.0') + ' --vm="kitematic-vm"';
};

Boot2Docker.exec = function (command, callback) {
  exec(Boot2Docker.command() + ' ' + command, function(err, stdout, stderr) {
    callback(err, stdout, stderr);
  });
};

Boot2Docker.exists = function (callback) {
  this.exec('info', function (err) {
    if (err) {
      callback(null, false);
    } else {
      callback(null, true);
    }
  });
};

Boot2Docker.stop = function (callback) {
  this.exec('stop', function (err, stdout) {
    // Sometimes stop returns an error even though it worked
    callback(null);
  });
};

Boot2Docker.erase = function (callback) {
  var VMFileLocation = path.join(Util.getHomePath(), 'VirtualBox\\ VMs/kitematic-vm');
  exec('rm -rf ' + VMFileLocation, function (err) {
    callback(err);
  });
};

Boot2Docker.upgrade = function (callback) {
  var self = this;
  self.stop(function (err) {
    self.exec('upgrade', function (err, stdout) {
      callback(err);
    });
  });
};

Boot2Docker.ip = function (callback) {
  this.exec('ip', function (err, stdout) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, stdout);
    }
  });
};

Boot2Docker.setIp = function (ifname, ip, callback) {
  Boot2Docker.exec('ssh "sudo ifconfig ' + ifname + ' ' + ip + ' netmask 255.255.255.0"', function (err, stdout) {
    Boot2Docker.exec('ssh "sudo rm -rf /var/lib/boot2docker/tls/* && sudo /etc/init.d/docker restart"', function (err, stdout) {
      callback(err);
    });
  });
};

Boot2Docker.init = function (callback) {
  this.exec('init', function (err) {
    callback(err);
  });
};

Boot2Docker.start = function (callback) {
  var self = this;
  self.exists(function (err, exists) {
    if (!exists) {
      callback('Cannot start if the boot2docker VM doesn\'t exist');
      return;
    }
    self.exec('start', function (err, stdout) {
      // Sometimes boot2docker returns an error code even though it's working / waiting, so treat that as success as well
      if (!err || (err.indexOf('Waiting') !== -1 || err.indexOf('Writing') !== -1 || err.indexOf('Generating a server cert') !== -1)) {
        self.correct(function (err) {
          self.injectUtilities(function (err) {
            callback(err);
          });
        });
      } else {
        callback(err);
      }
    });
  });
};

Boot2Docker.correct = function (callback) {
  Boot2Docker.setIp('eth1', Boot2Docker.REQUIRED_IP, function(err) {
    if (err) { callback(err); return; }
    VirtualBox.removeDHCP(function (err) {
      callback();
    });
  });
};

Boot2Docker.state = function (callback) {
  this.exec('info', function (err, stdout, stderr) {
    if (err) { callback(err, null); return; }
    try {
      var info = JSON.parse(stdout);
      callback(null, info.State);
    } catch (e) {
      callback(e, null);
    }
  });
};

Boot2Docker.diskUsage = function (callback) {
  this.exec('ssh "df"', function (err, stdout) {
    if (err) {
      callback(err, null);
      return;
    }
    try {
      var lines = stdout.split('\n');
      var dataline = _.find(lines, function (line) {
        return line.indexOf('/dev/sda1') !== -1;
      });
      var tokens = dataline.split(' ');
      tokens = tokens.filter(function (token) {
        return token !== '';
      });
      var usedGb = parseInt(tokens[2], 10) / 1000000;
      var totalGb = parseInt(tokens[3], 10) / 1000000;
      var percent = parseInt(tokens[4].replace('%', ''), 10);
      callback(null, {
        used_gb: usedGb.toFixed(2),
        total_gb: totalGb.toFixed(2),
        percent: percent
      });
    } catch (error) {
      callback(err, null);
    }
  });
};

Boot2Docker.memoryUsage = function (callback) {
  this.exec('ssh "free -m"', function (err, stdout) {
    if (err) {
      callback(err, null);
      return;
    }
    try {
      var lines = stdout.split('\n');
      var dataline = _.find(lines, function (line) {
        return line.indexOf('-/+ buffers') !== -1;
      });
      var tokens = dataline.split(' ');
      tokens = tokens.filter(function(token) {
        return token !== '';
      });
      var usedGb = parseInt(tokens[2], 10) / 1000;
      var freeGb = parseInt(tokens[3], 10) / 1000;
      var totalGb = usedGb + freeGb;
      var percent = Math.round(usedGb / totalGb * 100);
      callback(null, {
        used_gb: usedGb.toFixed(2),
        total_gb: totalGb.toFixed(2),
        free_gb: freeGb.toFixed(2),
        percent: percent
      });
    } catch (error) {
      callback(error, null);
    }
  });
};

Boot2Docker.stats = function (callback) {
  var self = this;
  self.state(function (err, state) {
    if (err) { callback(err, null); return; }
    if (state === 'poweroff') {
      callback(null, {state: state});
      return;
    }
    self.memoryUsage(function (err, mem) {
      if (err) {
        callback(null, {state: state});
        return;
      }
      self.diskUsage(function (err, disk) {
        if (err) {
          callback(null, {state: state, memory: mem});
          return;
        }
        callback(null, {
          state: state,
          memory: mem,
          disk: disk
        });
      });
    });
  });
};

Boot2Docker.sshKeyExists = function () {
  return fs.existsSync(path.join(Util.getHomePath(), '.ssh', 'id_boot2docker'));
};

/**
 * Get the VM's version.
 * Node that this only works if the VM is up and running.
 */
Boot2Docker.vmVersion = function (callback) {
  this.exec('ssh "cat /etc/version', function (err, stdout, stderr) {
    if (err) {
      callback(err);
      return;
    } else {
      callback(null, stdout);
    }
  });
};

Boot2Docker.version = function (callback) {
  this.exec('version', function (err, stdout, stderr) {
    if (err) {
      callback(err);
      return;
    }
    var match = stdout.match(/Client version: v(\d\.\d\.\d)/);
    if (!match || match.length < 2) {
      callback('Could not parse the boot2docker cli version.');
    } else {
      callback(null, match[1]);
    }
  });
};

Boot2Docker.injectUtilities = function (callback) {
  exec('/bin/cat ' + path.join(Util.getBinDir(), 'kite-binaries.tar.gz') + ' | ' +  Boot2Docker.command() + ' ssh "sudo tar zx -C /usr/local/bin && sudo chown -R root.root /usr/local/bin"', function (err, stdout) {
    callback(err);
  });
};

Boot2Docker.check = function (callback) {
  var self = this;
  self.exists(function (err, exists) {
    if (err) {
      callback(err);
      return;
    } else {
      self.state(function (err, state) {
        if (state !== 'running') {
          callback('boot2docker not running');
        } else {
          self.correct(function (err) {
            callback(err);
          });
        }
      });
    }
  });
};

Boot2Docker.resolve = function (callback) {
  var self = this;
  self.exists(function (err, exists) {
    // If somehow the boot2docker VM doesn't exist anymor then re-create it.
    if (!exists) {
      self.init(function () {
        self.start(function (err) {
          callback(err);
        });
      });
    } else {
      // If it exists but it's not running.. restart it.
      self.state(function (err, state) {
        if (state !== 'running') {
          self.start(function (err) {
            callback(err);
          });
        } else {
          callback();
        }
      });
    }
  });
};
