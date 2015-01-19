var exec = require('exec');
var path = require('path');
var fs = require('fs');
var path = require('path');
var async = require('async');

var cmdExec = function (cmd, callback) {
  exec(cmd, function (stderr, stdout, code) {
    if (code) {
      callback('Exit code ' + code + ': ' + stderr);
    } else {
      callback(null, stdout);
    }
  });
};

var homeDir = function () {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
};

var Boot2Docker = {
  version: function () {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))['boot2docker-version'];
  },
  cliVersion: function (callback) {
    cmdExec([Boot2Docker.command(), 'version'], function (err, out) {
      if (err) {
        callback(err);
        return;
      }
      var match = out.match(/version: v(\d+\.\d+\.\d+)/);
      if (!match || match.length < 2) {
        callback('Could not parse the boot2docker cli version.');
      } else {
        callback(null, match[1]);
      }
    });
  },
  isoVersion: function (callback) {
    fs.readFile(path.join(homeDir(), '.boot2docker', 'boot2docker.iso'), 'utf8', function (err, data) {
      if (err) {
        callback(err);
        return;
      }
      var match = data.match(/Boot2Docker-v(\d+\.\d+\.\d+)/);
      if (!match) {
        callback('Could not parse boot2docker iso version');
        return;
      }
      callback (null, match[1]);
    });
  },
  command: function () {
    return path.join(process.cwd(), 'resources', 'boot2docker-' + this.version());
  },
  exists: function (callback) {
    cmdExec([Boot2Docker.command(), 'info'], callback);
  },
  status: function (callback) {
    cmdExec([Boot2Docker.command(), 'status'], function (err, out) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, out.trim());
    });
  },
  init: function (callback) {
    cmdExec([Boot2Docker.command(), 'init'], callback);
  },
  start: function (callback) {
    cmdExec([Boot2Docker.command(), 'start'], callback);
  },
  stop: function (callback) {
    cmdExec([Boot2Docker.command(), 'stop'], callback);
  },
  upgrade: function (callback) {
    cmdExec([Boot2Docker.command(), 'upgrade'], callback);
  },
  ip: function (callback) {
    cmdExec([Boot2Docker.command(), 'ip'], callback);
  },
  erase: function (callback) {
    var VMFileLocation = path.join(homeDir(), 'VirtualBox\\ VMs/boot2docker-vm');
    cmdExec(['rm', '-rf', VMFileLocation], callback);
  },
  state: function (callback) {
    cmdExec([Boot2Docker.command(), 'info'], function (err, out) {
      if (err) {
        callback(err);
        return;
      }
      try {
        var info = JSON.parse(out);
        callback(null, info.State);
      } catch (e) {
        callback(e, null);
      }
    });
  },
  disk: function (callback) {
    cmdExec([Boot2Docker.command(), 'ssh', 'df'], function (err, out) {
      if (err) {
        callback(err);
        return;
      }
      try {
        var lines = out.split('\n');
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
  },
  memory: function (callback) {
    cmdExec([Boot2Docker.command(), 'ssh', 'free -m'], function (err, out) {
      if (err) {
        callback(err);
        return;
      }
      try {
        var lines = out.split('\n');
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
        callback(error);
      }
    });
  },
  createScratchImage: function (callback) {
    cmdExec([Boot2Docker.command(), 'ssh', 'tar cv --files-from /dev/null | docker import - scratch'], function (err, out) {
      callback(err);
    });
  },
  stats: function (callback) {
    var self = this;
    self.state(function (err, state) {
      if (err) {
        callback(err);
        return;
      }
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
  },
  sshKeyExists: function () {
    return fs.existsSync(path.join(homeDir(), '.ssh', 'id_boot2docker'));
  },

  // Todo: move me to setup
  waitWhileStatus: function (status, callback) {
    var current = status;
    async.whilst(function () {
      return current === status;
    }, function (callback) {
      Boot2Docker.status(function (err, vmStatus) {
        if (err) {
          callback(err);
        } else {
          current = vmStatus.trim();
          callback();
        }
      });
    }, function (err) {
      callback(err);
    });
  }
};

module.exports = Boot2Docker;
