import _ from 'underscore';
import path from 'path';
import Promise from 'bluebird';
import fs from 'fs';
import util from './Util';
import resources from './ResourcesUtil';

var DockerMachine = {
  command: function () {
    return resources.dockerMachine();
  },
  name: function () {
    return 'default';
  },
  isoversion: function (machineName = this.name()) {
    try {
      var data = fs.readFileSync(path.join(util.home(), '.docker', 'machine', 'machines', machineName, 'boot2docker.iso'), 'utf8');
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
  info: function (machineName = this.name()) {
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
      if (machines[machineName]) {
        return Promise.resolve(machines[machineName]);
      } else {
        return Promise.reject(new Error('Machine does not exist.'));
      }
    });
  },
  exists: function (machineName = this.name()) {
    return this.info(machineName).then(() => {
      return true;
    }).catch(() => {
      return false;
    });
  },
  create: function (machineName = this.name()) {
    return util.exec([this.command(), '-D', 'create', '-d', 'virtualbox', '--virtualbox-memory', '2048', machineName]);
  },
  start: function (machineName = this.name()) {
    return util.exec([this.command(), '-D', 'start', machineName]);
  },
  stop: function (machineName = this.name()) {
    return util.exec([this.command(), 'stop', machineName]);
  },
  upgrade: function (machineName = this.name()) {
    return util.exec([this.command(), 'upgrade', machineName]);
  },
  rm: function (machineName = this.name()) {
    return util.exec([this.command(), 'rm', '-f', machineName]);
  },
  ip: function (machineName = this.name()) {
    return util.exec([this.command(), 'ip', machineName]).then(stdout => {
      return Promise.resolve(stdout.trim().replace('\n', ''));
    });
  },
  regenerateCerts: function (machineName = this.name()) {
    return util.exec([this.command(), 'tls-regenerate-certs', '-f', machineName]);
  },
  state: function (machineName = this.name()) {
    return this.info(machineName).then(info => {
      return info ? info.state : null;
    });
  },
  disk: function (machineName = this.name()) {
    return util.exec([this.command(), 'ssh', machineName, 'df']).then(stdout => {
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
  memory: function (machineName = this.name()) {
    return util.exec([this.command(), 'ssh', machineName, 'free -m']).then(stdout => {
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
  stats: function (machineName = this.name()) {
    this.state(machineName).then(state => {
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
  dockerTerminal: function (cmd, machineName = this.name()) {
    if(util.isWindows()) {
      cmd = cmd || '';
      this.info(machineName).then(machine => {
        util.exec('start powershell.exe ' + cmd,
          {env: {
            'DOCKER_HOST' : machine.url,
            'DOCKER_CERT_PATH' : path.join(util.home(), '.docker/machine/machines/' + machine.name),
            'DOCKER_TLS_VERIFY': 1
          }
        });
      });
    } else {
      cmd = cmd || process.env.SHELL;
      this.info(machineName).then(machine => {
        util.exec([resources.terminal(), `DOCKER_HOST=${machine.url} DOCKER_CERT_PATH=${path.join(util.home(), '.docker/machine/machines/' + machine.name)} DOCKER_TLS_VERIFY=1 ${cmd}`]).then(() => {});
      });
    }
  },
};

module.exports = DockerMachine;
