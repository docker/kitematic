var _ = require('underscore');
var path = require('path');
var Promise = require('bluebird');
var _ = require('underscore');
var fs = require('fs');
var util = require('./Util');

var NAME = 'dev';

var DockerMachine = {
  command: function () {
    return path.join(process.cwd(), 'resources', 'docker-machine-' + this.version());
  },
  version: function () {
    try {
      return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))['docker-machine-version'];
    } catch (err) {
      return null;
    }
  },
  isoversion: function () {
    try {
      var data = fs.readFileSync(path.join(util.home(), '.docker', 'machine', 'cache', 'boot2docker.iso'), 'utf8');
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
  info: function () {
    return util.exec([DockerMachine.command(), 'ls']).then(stdout => {
      var lines = stdout.split('\n').filter(line => line.indexOf('time=') === -1);
      var machines = {};
      lines.slice(1, lines.length - 1).forEach(line => {
        var tokens = line.trim().split(/[\s]+/);
        if (tokens.length === 5) {
          tokens.splice(1, 1);
        }
        var machine = {
          name: tokens[0],
          driver: tokens[1],
          state: tokens[2].toLower(),
          url: tokens[3]
        };
        machines[machine.name] = machine;
      });
      if (machines[NAME]) {
        return machines[NAME];
      } else {
        throw new Error('Machine does not exist.');
      }
    });
  },
  exists: function () {
    return DockerMachine.info().then(info => {
      if (info) {
        return Promise.resolve(true);
      } else {
        return Promise.resolve(false);
      }
    });
  },
  status: function () {
    DockerMachine.info().then(info => {
      return info ? info.status : null;
    });
  },
  create: function () {
    return util.exec([DockerMachine.command(), 'create', '-d', 'virtualbox', NAME]);
  },
  start: function () {
    return util.exec([DockerMachine.command(), 'start', NAME]);
  },
  stop: function () {
    return util.exec([DockerMachine.command(), 'stop', NAME]);
  },
  upgrade: function () {
    return util.exec([DockerMachine.command(), 'upgrade', NAME]);
  },
  destroy: function () {
    return util.exec([DockerMachine.command(), 'rm -f', NAME]);
  },
  ip: function () {
    return util.exec([DockerMachine.command(), 'ip']).then(stdout => {
      return Promise.resolve(stdout.trim().replace('\n', ''));
    });
  },
  erase: function () {
    return util.exec(['rm', '-rf', path.join(util.home(), 'VirtualBox\\ VMs/boot2docker-vm')]);
  },
  state: function () {
    util.exec([DockerMachine.command(), 'info']).then(stdout => {
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
    DockerMachine.state().then(state => {
      if (state === 'poweroff') {
        return Promise.resolve({state: state});
      }
      var memory = DockerMachine.memory();
      var disk = DockerMachine.disk();
      return Promise.all([memory, disk]).spread((memory, disk) => {
        return Promise.resolve({
          state: state,
          memory: memory,
          disk: disk
        });
      });
    });
  },
  waitstatus: Promise.coroutine(function* () {
    while (true) {
      var current = yield DockerMachine.status();
      if (status !== current.trim()) {
        return;
      }
    }
  })
};

module.exports = DockerMachine;
