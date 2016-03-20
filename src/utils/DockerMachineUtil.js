import _ from 'underscore';
import path from 'path';
import Promise from 'bluebird';
import fs from 'fs';
import util from './Util';
import child_process from 'child_process';

const supportedDrivers = ['virtualbox', 'parallels', 'vmwarefusion', 'vmwareworkstation', 'hyperv', 'xhyve', 'kvm'];

var DockerMachine = {
  command: function () {
    if (util.isWindows()) {
      return path.join(process.env.DOCKER_TOOLBOX_INSTALL_PATH, 'docker-machine.exe');
    } else {
      return '/usr/local/bin/docker-machine';
    }
  },
  name: function () {
    return localStorage.getItem('dockerMachine.name') || 'default';
  },
  setName: function (name) {
    localStorage.setItem('dockerMachine.name', name);
  },
  resetName: function () {
    localStorage.removeItem('dockerMachine.name');
  },
  installed: function () {
    if (util.isWindows() && !process.env.DOCKER_TOOLBOX_INSTALL_PATH) {
      return false;
    }
    return fs.existsSync(this.command());
  },
  version: function () {
    return util.execFile([this.command(), '-v']).then(stdout => {
      try {
        var matchlist = stdout.match(/(\d+\.\d+\.\d+).*/);
        if (!matchlist || matchlist.length < 2) {
          return Promise.reject('docker-machine -v output format not recognized.');
        }
        return Promise.resolve(matchlist[1]);
      } catch (err) {
        return Promise.resolve(null);
      }
    }).catch(() => {
      return Promise.resolve(null);
    });
  },
  list: function () {
    return util.execFile([this.command(), 'ls']).then(stdout => {
      try {
        var lines = stdout.match(/[^\r\n]+/g);
        var machines = lines.slice(1).map(line => {
          var parts = line.split(/\s+/);
          return {
            name: parts[0],
            driver: parts[2],
            state: parts[3],
            url: parts[4]
          }
        }).filter(m => { return _.contains(supportedDrivers, m.driver); });
        return Promise.resolve(machines);
      } catch (err) {
        return Promise.reject(err);
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
  exists: function (machineName = this.name()) {
    return this.status(machineName).then(() => {
      return true;
    }).catch(() => {
      return false;
    });
  },
  create: function (machineName = this.name()) {
    return util.execFile([this.command(), '-D', 'create', '-d', 'virtualbox', '--virtualbox-memory', '2048', machineName]);
  },
  start: function (machineName = this.name()) {
    return util.execFile([this.command(), '-D', 'start', machineName]);
  },
  stop: function (machineName = this.name()) {
    return util.execFile([this.command(), 'stop', machineName]);
  },
  upgrade: function (machineName = this.name()) {
    return util.execFile([this.command(), 'upgrade', machineName]);
  },
  rm: function (machineName = this.name()) {
    return util.execFile([this.command(), 'rm', '-f', machineName]);
  },
  ip: function (machineName = this.name()) {
    return util.execFile([this.command(), 'ip', machineName]).then(stdout => {
      return Promise.resolve(stdout.trim().replace('\n', ''));
    });
  },
  url: function (machineName = this.name()) {
    return util.execFile([this.command(), 'url', machineName]).then(stdout => {
      return Promise.resolve(stdout.trim().replace('\n', ''));
    });
  },
  regenerateCerts: function (machineName = this.name()) {
    return util.execFile([this.command(), 'tls-regenerate-certs', '-f', machineName]);
  },
  status: function (machineName = this.name()) {
    return new Promise((resolve, reject) => {
      child_process.execFile(this.command(), ['status', machineName], (error, stdout, stderr) => {
        if (error) {
          reject(new Error('Encountered an error: ' + error));
        } else {
          resolve(stdout.trim() + stderr.trim());
        }
      });
    });
  },
  disk: function (machineName = this.name()) {
    return util.execFile([this.command(), 'ssh', machineName, 'df']).then(stdout => {
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
    return util.execFile([this.command(), 'ssh', machineName, 'free -m']).then(stdout => {
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
    } else if (util.isNative()) {
      cmd = cmd || process.env.SHELL;
      var terminal = util.isLinux() ? util.linuxTerminal() : path.join(process.env.RESOURCES_PATH, 'terminal');
      if (terminal) {
        util.execFile([terminal, cmd]).then(() => {});
      }
    } else {
      cmd = cmd || process.env.SHELL;
      this.url(machineName).then(machineUrl => {
        util.execFile([path.join(process.env.RESOURCES_PATH, 'terminal'), `DOCKER_HOST=${machineUrl} DOCKER_CERT_PATH=${path.join(util.home(), '.docker/machine/machines/' + machineName)} DOCKER_TLS_VERIFY=1 ${cmd}`]).then(() => {});
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
