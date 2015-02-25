var _ = require('underscore');
var path = require('path');
var Promise = require('bluebird');
var _ = require('underscore');
var fs = require('fs');
var util = require('./Util');

var Boot2Docker = {
  command: function () {
    return path.join(process.cwd(), 'resources', 'boot2docker-' + this.version());
  },
  version: function () {
    try {
      return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))['boot2docker-version'];
    } catch (err) {
      return null;
    }
  },
  isoversion: function () {
    try {
      var data = fs.readFileSync(path.join(util.home(), '.boot2docker', 'boot2docker.iso'), 'utf8');
      var match = data.match(/Boot2Docker-v(\d+\.\d+\.\d+)/);
      if (match) {
        return match[1];
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  },
  exists: function () {
    return util.exec([Boot2Docker.command(), 'status']).then(() => {
      return Promise.resolve(true);
    }).catch(() => {
      return Promise.resolve(false);
    });
  },
  status: function () {
    return util.exec([Boot2Docker.command(), 'status']).then(stdout => {
      return Promise.resolve(stdout.trim());
    });
  },
  init: function () {
    return util.exec([Boot2Docker.command(), 'init']);
  },
  start: function () {
    return util.exec([Boot2Docker.command(), 'start']);
  },
  stop: function () {
    return util.exec([Boot2Docker.command(), 'stop']);
  },
  upgrade: function () {
    return util.exec([Boot2Docker.command(), 'upgrade']);
  },
  destroy: function () {
    return util.exec([Boot2Docker.command(), 'destroy']);
  },
  ip: function () {
    return util.exec([Boot2Docker.command(), 'ip']).then(stdout => {
      return Promise.resolve(stdout.trim().replace('\n', ''));
    });
  },
  erase: function () {
    return util.exec(['rm', '-rf', path.join(util.home(), 'VirtualBox\\ VMs/boot2docker-vm')]);
  },
  state: function () {
    util.exec([Boot2Docker.command(), 'info']).then(stdout => {
      try {
        var info = JSON.parse(stdout);
        return Promise.resolve(info.State);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  },
  disk: function () {
    return util.exec([Boot2Docker.command(), 'ssh', 'df']).then(stdout => {
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
        return {
          used_gb: usedGb.toFixed(2),
          total_gb: totalGb.toFixed(2),
          percent: percent
        };
      } catch (err) {
        return Promise.reject(err);
      }
    });
  },
  memory: function () {
    return util.exec([this.command(), 'ssh', 'free -m']).then(stdout => {
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
        return {
          used_gb: usedGb.toFixed(2),
          total_gb: totalGb.toFixed(2),
          free_gb: freeGb.toFixed(2),
          percent: percent
        };
      } catch (err) {
        return Promise.reject(err);
      }
    });
  },
  stats: function () {
    Boot2Docker.state().then(state => {
      if (state === 'poweroff') {
        return Promise.resolve({state: state});
      }
      var memory = Boot2Docker.memory();
      var disk = Boot2Docker.disk();
      return Promise.all([memory, disk]).spread((memory, disk) => {
        return Promise.resolve({
          state: state,
          memory: memory,
          disk: disk
        });
      });
    });
  },
  haskeys: function () {
    return fs.existsSync(path.join(util.home(), '.ssh', 'id_boot2docker'));
  },
  waitstatus: Promise.coroutine(function* () {
    while (true) {
      var current = yield Boot2Docker.status();
      if (status !== current.trim()) {
        return;
      }
    }
  })
};

module.exports = Boot2Docker;
