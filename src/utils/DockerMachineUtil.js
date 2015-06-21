var _ = require('underscore');
var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');
var util = require('./Util');
var resources = require('./ResourcesUtil');

var DockerMachine = {
  command: function () {
    return resources.dockerMachine();
  },
  isoversion: function (name) {
    try {
      var data = fs.readFileSync(path.join(util.home(), '.docker', 'machine', 'machines', name, 'boot2docker.iso'), 'utf8');
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
  info: function (name) {
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
        machines[name] = machine;
      });
      if (machines[name]) {
        return Promise.resolve(machines[name]);
      } else {
        return Promise.reject(new Error('Machine does not exist.'));
      }
    });
  },
  exists: function (name) {
    return this.info(name).then(() => {
      return true;
    }).catch(() => {
      return false;
    });
  },
  create: function (driver, driverFlags) {
    var cmd = [this.command(), '-D', 'create', '-d', driver];
    cmd.push.apply(cmd, driverFlags);
    cmd.push(driver);
    return util.exec(cmd);
  },
  start: function (name) {
    return util.exec([this.command(), '-D', 'start', name]);
  },
  stop: function (name) {
    return util.exec([this.command(), 'stop', name]);
  },
  upgrade: function (name) {
    return util.exec([this.command(), 'upgrade', name]);
  },
  rm: function (name) {
    return util.exec([this.command(), 'rm', '-f', name]);
  },
  ip: function (name) {
    return util.exec([this.command(), 'ip', name]).then(stdout => {
      return Promise.resolve(stdout.trim().replace('\n', ''));
    });
  },
  regenerateCerts: function (name) {
    return util.exec([this.command(), 'tls-regenerate-certs', '-f', name]);
  },
  state: function (name) {
    return this.info(name).then(info => {
      return info ? info.state : null;
    });
  },
  disk: function (name) {
    return util.exec([this.command(), 'ssh', name, 'df']).then(stdout => {
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

          total_gb: totalGb.toFixed(2),
          percent: percent
        };
      } catch (err) {
        return Promise.reject(err);
      }
    });
  },
  memory: function (name) {
    return util.exec([this.command(), 'ssh', name, 'free -m']).then(stdout => {
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
  stats: function (name) {
    this.state(name).then(state => {
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
  dockerTerminal: function (name, cmd) {
    if(util.isWindows()) {
      cmd = cmd || '';
      this.info(name).then(machine => {
        util.exec('start powershell.exe ' + cmd,
          {env: {
            'DOCKER_HOST' : machine.url,
            'DOCKER_CERT_PATH' : path.join(util.home(), '.docker/machine/machines/' + name),
            'DOCKER_TLS_VERIFY': 1
          }
        });
      });
    } else {
      cmd = cmd || process.env.SHELL;
      this.info().then(machine => {
        util.exec([resources.terminal(), `DOCKER_HOST=${machine.url} DOCKER_CERT_PATH=${path.join(util.home(), '.docker/machine/machines/' + name)} DOCKER_TLS_VERIFY=1 ${cmd}`]).then(() => {});
      });
    }
  },
};

module.exports = DockerMachine;
