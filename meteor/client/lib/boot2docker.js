var exec = require('exec');
var path = require('path');
var fs = require('fs');
var path = require('path');
var async = require('async');
var packagejson = JSON.parse(fs.readFileSync(path.join(process.env.DIR, 'package.json'), 'utf8'));


Boot2Docker = {};
Boot2Docker.VERSION = packagejson['boot2docker-version'];

Boot2Docker.command = function () {
  return path.join(Util.getBinDir(), 'boot2docker-' + Boot2Docker.VERSION);
};

Boot2Docker.exec = function (command, callback) {
  var cmd = [Boot2Docker.command()];
  cmd.push.apply(cmd, command);
  exec(cmd, function(stderr, stdout, code) {
    callback(stderr, stdout, code);
  });
};

Boot2Docker.exists = function (callback) {
  this.exec(['info'], function (stderr, stdout, code) {
    if (code) {
      callback(null, false);
    } else {
      callback(null, true);
    }
  });
};

Boot2Docker.stop = function (callback) {
  this.exec(['stop'], function (stderr, stdout, code) {
    if (code) {
      callback(stderr);
    } else {
      callback();
    }
  });
};

Boot2Docker.erase = function (callback) {
  var VMFileLocation = path.join(Util.getHomePath(), 'VirtualBox\\ VMs/boot2docker-vm');
  exec(['rm', '-rf', VMFileLocation], function (stderr) {
    callback(stderr);
  });
};

Boot2Docker.upgrade = function (callback) {
  var self = this;
  self.stop(function (stderr, stdout, code) {
    if (code) {callback(stderr); return;}
    self.exec(['upgrade'], function (stderr, stdout, code) {
      if (code) {
        callback(stderr);
      } else {
        callback();
      }
    });
  });
};

Boot2Docker.ip = function (callback) {
  this.exec(['ip'], function (stderr, stdout, code) {
    if (code) {
      callback(stderr, null);
    } else {
      callback(null, stdout);
    }
  });
};

Boot2Docker.init = function (callback) {
  this.exec(['init'], function (stderr, stdout, code) {
    if (code) {
      callback(stderr);
    } else {
      callback();
    }
  });
};

Boot2Docker.start = function (callback) {
  var self = this;
  self.exists(function (err, exists) {
    if (!exists) {
      callback('Cannot start if the boot2docker VM doesn\'t exist');
      return;
    }
    self.exec(['start'], function (stderr, stdout, code) {
      if (code) {
        callback(stderr);
      } else {
        callback();
      }
    });
  });
};

Boot2Docker.state = function (callback) {
  this.exec(['info'], function (stderr, stdout, code) {
    if (code) { callback(stderr, null); return; }
    try {
      var info = JSON.parse(stdout);
      callback(null, info.State);
    } catch (e) {
      callback(e, null);
    }
  });
};

Boot2Docker.diskUsage = function (callback) {
  this.exec(['ssh', 'df'], function (stderr, stdout, code) {
    if (code) {
      callback(stderr, null);
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
      callback(error, null);
    }
  });
};

Boot2Docker.memoryUsage = function (callback) {
  this.exec(['ssh', 'free -m'], function (stderr, stdout, code) {
    if (code) {
      callback(stderr, null);
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

Boot2Docker.version = function (callback) {
  this.exec(['version'], function (stderr, stdout, code) {
    if (code) {
      callback(stderr);
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
          callback();
        }
      });
    }
  });
};

Boot2Docker.vmUpToDate = function (callback) {
  fs.readFile(path.join(Util.getHomePath(), '.boot2docker', 'boot2docker.iso'), 'utf8', function (err, data) {
    if (err) {
      callback(err); return;
    }
    var match = data.match(/Boot2Docker-v(\d+\.\d+\.\d+)/);
    if (!match) {
      callback('Could not parse boot2docker iso version');
      return;
    }
    callback (null, Util.compareVersions(match[1], Boot2Docker.VERSION) >= 0);
  });
};

Boot2Docker.status = function (callback) {
  this.exec(['status'], function (stderr, stdout, code) {
    if (code) {callback(stderr); return;}
    callback(null, stdout.trim());
  });
};

Boot2Docker.portAvailable = function (port, protocol, callback) {
  this.exec(['ssh', 'netstat -lntu | grep LISTEN | grep ' + protocol + ' | grep -c ":::' + port + '\\s"'], function (stdout, stderr, code) {
    if (stderr.trim() === '0') {
      callback(true);
    } else {
      callback(false);
    }
  });
};

Boot2Docker.waitWhileStatus = function (status, callback) {
  var current = status;
  async.whilst(function () {
    return current === status;
  }, function (innerCallback) {
    Boot2Docker.status(function (err, vmStatus) {
      if (err) {innerCallback(err); return;}
      current = vmStatus.trim();
      innerCallback();
    });
  }, function (err) {
    callback(err);
  });
};
