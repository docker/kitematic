var _ = require('underscore');
var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');
var util = require('./Util');
var exec = require('child_process').exec;
var resources = require('./Resources');

var NAME = 'dev';

var DockerMachine = {
  command() {
    return resources.docker_machine();
  },
  name() {
    return NAME;
  },
  isoversion() {
    try {
      var data = fs.readFileSync(path.join(util.home(), '.docker', 'machine', 'machines', NAME, 'boot2docker.iso'), 'utf8');
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
  info() {
    return util.exec([this.command(), 'ls']).then(stdout => {
      var lines = stdout.trim().split('\n').filter(line => line.indexOf('time=') === -1);
      var machines = {};
      lines.slice(1, lines.length).forEach(line => {
        var tokens = line.trim().split(/[\s]+/).filter(token => token !== '*');
        var machine = {
          name: tokens[0],
          driver: tokens[1],
          state: tokens[2],
          url: tokens[3] || ''
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
  exists() {
    return this.info().then(() => {
      return true;
    }).catch(() => {
      return false;
    });
  },

  create() {
    return util.exec([this.command(), 'create', '-d', 'virtualbox', '--virtualbox-memory', '2048', NAME]);
  },
  start() {
    return util.exec([this.command(), 'start', NAME]);
  },
  stop() {
    return util.exec([this.command(), 'stop', NAME]);
  },
  upgrade() {
    return util.exec([this.command(), 'upgrade', NAME]);
  },
  rm() {
    return util.exec([this.command(), 'rm', '-f', NAME]);
  },
  ip() {
    return util.exec([this.command(), 'ip', NAME]).then(stdout => {
      return Promise.resolve(stdout.trim().replace('\n', ''));
    });
  },
  regenerateCerts() {
    return util.exec([this.command(), 'tls-regenerate-certs', '-f', NAME]);
  },
  state() {
    return this.info().then(info => {
      return info ? info.state : null;
    });
  },
  disk() {
    return util.exec([this.command(), 'ssh', NAME, 'df']).then(stdout => {
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
  memory() {
    return util.exec([this.command(), 'ssh', NAME, 'free -m']).then(stdout => {
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
  stats() {
    this.state().then(state => {
      if (state === 'Stopped') {
        return Promise.resolve({state: state});
      }
      var memory = this.memory();
      var disk = this.disk();
      return Promise.all([memory, disk]).spread((memory, disk) => {
        return Promise.resolve({
          memory: memory,
          disk: disk
        });
      });
    });
  },
  dockerTerminal() {
    if(util.isWindows()) {
      this.info().then(machine => {
        util.execProper(`start cmd.exe /k "SET DOCKER_HOST=${machine.url}&& SET DOCKER_CERT_PATH=${path.join(util.home(), '.docker/machine/machines/' + machine.name)}&& SET DOCKER_TLS_VERIFY=1`);
      });
    } else {
      this.info().then(machine => {
        var cmd = [resources.terminal(), `DOCKER_HOST=${machine.url} DOCKER_CERT_PATH=${path.join(util.home(), '.docker/machine/machines/' + machine.name)} DOCKER_TLS_VERIFY=1 $SHELL`];
        util.exec(cmd).then(() => {});
      });
    }
  }
};

module.exports = DockerMachine;
