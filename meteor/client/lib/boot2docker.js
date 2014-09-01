var exec = require('exec');
var path = require('path');

Boot2Docker = {};

Boot2Docker.REQUIRED_IP = '192.168.60.103';

Boot2Docker.exec = function (command, callback) {
  exec(path.join(getBinDir(), 'boot2docker') + ' ' + command, function(err, stdout, stderr) {
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
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
};

Boot2Docker.erase = function (callback) {
  var VMFileLocation = path.join(getHomePath(), 'VirtualBox\\ VMs/boot2docker-vm');
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
  this.exec('ssh "sudo ifconfig ' + ifname + ' ' + ip + ' netmask 255.255.255.0"', function (err, stdout) {
    callback(err);
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
    self.exec('up -v', function (err, stdout) {
      console.log('here0');
      console.log('here1');
      // Sometimes boot2docker returns an error code even though it's working / waiting, so treat that as
      // Success as well
      if (!err || (err.indexOf('Waiting for VM to be started') !== -1 || err.indexOf('..........') !== -1)) {
        Boot2Docker.setIp('eth2', Boot2Docker.REQUIRED_IP, function(err) {
          console.log('here1');
          if (err) { callback(err); return; }
          VirtualBox.removeDHCP(function (err) {
            console.log('here2');
            self.injectUtilities(function (err) {
              console.log('here3');
              callback(err);
            });
          });
        });
      } else {
        callback(err);
      }
    });
  });
};

Boot2Docker.state = function (callback) {
  this.exec('info', function (err, stdout) {
    if (err) {
      callback(err, null);
      return;
    }
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
  this.state(function (err, state) {
    if (err) {
      callback(err, null);
      return;
    }
    if (state === 'poweroff') {
      callback(null, {state: state});
      return;
    }
    this.memoryUsage(function (err, mem) {
      if (err) {
        callback(null, {state: state});
        return;
      }
      this.diskUsage(function (err, disk) {
        if (err) {
          callback(null, {state: state});
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
      callback('Could not parse the boot2docker cli version.')
    } else {
      callback(null, match[1]);
    }
  });
};

Boot2Docker.injectUtilities = function (callback) {
  exec('/bin/cat ' + path.join(getBinDir(), 'kite-binaries.tar.gz') + ' | ' +  path.join(getBinDir(), 'boot2docker') + ' ssh "tar zx -C /usr/local/bin"', function (err, stdout) {
    callback(err);
  });
};

Boot2Docker.check = function (callback) {
  var self = this;
  self.exists(function (err) {
    if (err) {
      callback(err);
      return;
    } else {
      self.state(function (err, state) {
        if (state !== 'running') {
          callback('boot2docker not running');
        } else {
          callback();
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
      initBoot2Docker(function () {
        startBoot2Docker(function (err) {
          callback(err);
        });
      });
    } else {
      // If it exists but it's not running.. restart it.
      self.state(function (err, state) {
        if (state !== 'running') {
          startBoot2Docker(function (err) {
            callback(err);
          });
        } else {
          callback();
        }
      });
    }
  });
};
