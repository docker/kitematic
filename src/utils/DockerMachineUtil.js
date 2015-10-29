import _ from 'underscore';
import path from 'path';
import Promise from 'bluebird';
import fs from 'fs';
import util from './Util';

var DockerMachine = {
  command: function () {
    if (util.isWindows()) {
      return path.join(process.env.DOCKER_TOOLBOX_INSTALL_PATH, 'docker-machine.exe');
    } else {
      return '/usr/local/bin/docker-machine';
    }
  },
  name: function () {
    return util.vmsettings().name || 'default';
  },
  driver: function () {
    return util.vmsettings().driver || 'virtualbox';
  },
  installed: function () {
    if (util.isWindows() && !process.env.DOCKER_TOOLBOX_INSTALL_PATH) {
      return false;
    }
    return fs.existsSync(this.command());
  },
  version: function () {
    return util.exec([this.command(), '-v']).then(stdout => {
      try {
        var matchlist = stdout.match(/(\d+\.\d+\.\d+).*/);
        if (!matchlist || matchlist.length < 2) {
          Promise.reject('docker-machine -v output format not recognized.');
        }
        return Promise.resolve(matchlist[1]);
      } catch (err) {
        return Promise.resolve(null);
      }
    }).catch(() => {
      return Promise.resolve(null);
    });
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
  list: function () {
    return util.exec([this.command(), 'ls']).then(stdout => {
      var lines = stdout.trim().split('\n').filter(line => line.indexOf('time=') === -1);
      var machines = {};
      lines.slice(1, lines.length).forEach(line => {
        var tokens = line.trim().split(/[\s]+/).filter(token => token !== '*');
        var machine = {
          name: tokens[0],
          active: tokens[1],
          driver: tokens[2],
          state: tokens[3],
          url: tokens[4] || ''
        };
        machines[machine.name] = machine;
      });
      return Promise.resolve(machines);
    });
  },
  exists: function (machineName = this.name()) {
    return this.status(machineName).then(() => {
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
  url: function (machineName = this.name()) {
    return util.exec([this.command(), 'url', machineName]).then(stdout => {
      return Promise.resolve(stdout.trim().replace('\n', ''));
    });
  },
  regenerateCerts: function (machineName = this.name()) {
    return util.exec([this.command(), 'tls-regenerate-certs', '-f', machineName]);
  },
  status: function (machineName = this.name()) {
    return util.exec([this.command(), 'status', machineName]).then(stdout => {
      return Promise.resolve(stdout.trim().replace('\n', ''));
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
        tokens = tokens.filter((token) => {
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
  dockerTerminal: function (cmd, machineName = this.name()) {
    if (util.isWindows()) {
      cmd = cmd || '';
      this.url(machineName).then(machineUrl => {
        util.exec('start powershell.exe ' + cmd,
          {env: {
            'DOCKER_HOST': machineUrl,
            'DOCKER_CERT_PATH': path.join(util.home(), '.docker', 'machine', 'machines', machineName),
            'DOCKER_TLS_VERIFY': 1
          }
        });
      });
    } else {
      cmd = cmd || process.env.SHELL;
      this.url(machineName).then(machineUrl => {
        util.exec([path.join(process.env.RESOURCES_PATH, 'terminal'), `DOCKER_HOST=${machineUrl} DOCKER_CERT_PATH=${path.join(util.home(), '.docker/machine/machines/' + machineName)} DOCKER_TLS_VERIFY=1 ${cmd}`]).then(() => {});
      });
    }
  },
  virtualBoxLogs: function (machineName = this.name()) {
    let logsPath = path.join(util.home(), '.docker', 'machine', 'machines', machineName, machineName, 'Logs', 'VBox.log');
    let logData = null;
    try {
      logData = fs.readFileSync(logsPath, 'utf8');
    } catch (e) {
      console.error(e);
    }
    return logData;
  }
};

module.exports = DockerMachine;
