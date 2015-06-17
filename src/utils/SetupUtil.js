var _ = require('underscore');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var request = require('request');
var progress = require('request-progress');
var Promise = require('bluebird');
var util = require('./Util');
var resources = require('./ResourcesUtil');
var virtualBox = require ('./VirtualBoxUtil');

var SetupUtil = {
  needsBinaryFix() {
    return this.pathDoesNotExistOrDenied(util.binsPath()) ||
        (fs.existsSync(util.dockerBinPath()) && this.pathDenied(util.dockerBinPath())) ||
        (fs.existsSync(util.dockerMachineBinPath()) && this.pathDenied(util.dockerMachineBinPath()));
  },
  pathDoesNotExistOrDenied: function (path) {
    if(util.isWindows()) {
      return (!fs.existsSync(path));
    } else {
      return (!fs.existsSync(path) || this.pathDenied(path));
    }
  },
  pathDenied: function (path) {
    return fs.statSync(path).gid !== 80 || fs.statSync(path).uid !== process.getuid();
  },
  shouldUpdateBinaries: function () {
    return !fs.existsSync(util.dockerBinPath()) ||
        !fs.existsSync(util.dockerMachineBinPath()) ||
        this.checksum(util.dockerMachineBinPath()) !== this.checksum(resources.dockerMachine()) ||
        this.checksum(util.dockerBinPath()) !== this.checksum(resources.docker());
  },
  copycmd: function (src, dest) {
    return ['rm', '-f', dest, '&&', 'cp', src, dest];
  },
  copyBinariesCmd: function () {
    var cmd = ['mkdir', '-p', '/usr/local/bin'];
    cmd.push('&&');
    cmd.push.apply(cmd, this.copycmd(util.escapePath(resources.dockerMachine()), '/usr/local/bin/docker-machine'));
    cmd.push('&&');
    cmd.push.apply(cmd, this.copycmd(util.escapePath(resources.docker()), '/usr/local/bin/docker'));
    return cmd.join(' ');
  },
  fixBinariesCmd: function () {
    var cmd = [];
    cmd.push.apply(cmd, ['chown', `${process.getuid()}:${80}`, path.join('/usr/local/bin')]);
    cmd.push('&&');
    cmd.push.apply(cmd, ['chown', `${process.getuid()}:${80}`, path.join('/usr/local/bin', 'docker-machine')]);
    cmd.push('&&');
    cmd.push.apply(cmd, ['chown', `${process.getuid()}:${80}`, path.join('/usr/local/bin', 'docker')]);
    return cmd.join(' ');
  },
  installVirtualBoxCmd: function () {
    if(util.isWindows()) {
      return `powershell.exe -ExecutionPolicy unrestricted -Command "Start-Process \\\"${path.join(util.supportDir(), virtualBox.filename())}\\\" -ArgumentList \\\"--silent --msiparams REBOOT=ReallySuppress\\\" -Verb runAs -Wait"`;
    } else {
      return `installer -pkg ${util.escapePath(path.join(util.supportDir(), virtualBox.filename()))} -target /`;
    }
  },
  macSudoCmd: function (cmd) {
    return `${util.escapePath(resources.macsudo())} -p "Kitematic requires administrative privileges to install and/or start VirtualBox." sh -c \"${cmd}\"`;
  },
  simulateProgress(estimateSeconds, progress) {
    var times = _.range(0, estimateSeconds * 1000, 200);
    var timers = [];
    _.each(times, time => {
      var timer = setTimeout(() => {
        progress(100 * time / (estimateSeconds * 1000));
      }, time);
      timers.push(timer);
    });
  },
  checksum(filename) {
    return crypto.createHash('sha256').update(fs.readFileSync(filename), 'utf8').digest('hex');
  },
  download(url, filename, checksum, percentCallback) {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(filename)) {
        var existingChecksum = this.checksum(filename);
        if (existingChecksum === checksum) {
          resolve();
          return;
        } else {
          fs.unlinkSync(filename);
        }
      }

      progress(request({ uri: url, rejectUnauthorized: false }), { throttle: 10 }).on('progress', state => {
        if (percentCallback) {
          percentCallback(state.percent);
        }
      }).on('error', err => {
        reject(err);
      }).pipe(fs.createWriteStream(filename)).on('error', err => {
        reject(err);
      }).on('close', err => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }
};

module.exports = SetupUtil;
