var _ = require('underscore');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var request = require('request');
var progress = require('request-progress');
var Promise = require('bluebird');
var util = require('./Util');

var SetupUtil = {
  needsBinaryFix: function () {
    if (!fs.existsSync('/usr/local') || !fs.existsSync('/usr/local/bin')) {
      return true;
    }
    if (!fs.existsSync('/usr/local/bin/docker') && !fs.existsSync('/usr/local/bin/docker-machine')) {
      return fs.statSync('/usr/local/bin').gid !== 80 || fs.statSync('/usr/local/bin').uid !== process.getuid();
    }

    if (fs.existsSync('/usr/local/bin/docker') && (fs.statSync('/usr/local/bin/docker').gid !== 80 || fs.statSync('/usr/local/bin/docker').uid !== process.getuid())) {
      return true;
    }

    if (fs.existsSync('/usr/local/bin/docker-machine') && (fs.statSync('/usr/local/bin/docker-machine').gid !== 80 || fs.statSync('/usr/local/bin/docker-machine').uid !== process.getuid())) {
      return true;
    }
    return false;
  },
  copycmd: function (src, dest) {
    return ['rm', '-f', dest, '&&', 'cp', src, dest];
  },
  escapePath: function (str) {
    return str.replace(/ /g, '\\ ').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  },
  shouldUpdateBinaries: function () {
    var packagejson = util.packagejson();
    return !fs.existsSync('/usr/local/bin/docker') ||
      !fs.existsSync('/usr/local/bin/docker-machine') ||
      this.checksum('/usr/local/bin/docker-machine') !== this.checksum(path.join(util.resourceDir(), 'docker-machine-' + packagejson['docker-machine-version'])) ||
      this.checksum('/usr/local/bin/docker') !== this.checksum(path.join(util.resourceDir(), 'docker-' + packagejson['docker-version']));
  },
  copyBinariesCmd: function () {
    var packagejson = util.packagejson();
    var cmd = ['mkdir', '-p', '/usr/local/bin'];
    cmd.push('&&');
    cmd.push.apply(cmd, this.copycmd(this.escapePath(path.join(util.resourceDir(), 'docker-machine-' + packagejson['docker-machine-version'])), '/usr/local/bin/docker-machine'));
    cmd.push('&&');
    cmd.push.apply(cmd, this.copycmd(this.escapePath(path.join(util.resourceDir(), 'docker-' + packagejson['docker-version'])), '/usr/local/bin/docker'));
    return cmd.join(' ');
  },
  fixBinariesCmd: function () {
    var cmd = [];
    cmd.push.apply(cmd, ['chown', `${process.getuid()}:${80}`, this.escapePath(path.join('/usr/local/bin', 'docker-machine'))]);
    cmd.push('&&');
    cmd.push.apply(cmd, ['chown', `${process.getuid()}:${80}`, this.escapePath(path.join('/usr/local/bin', 'docker'))]);
    return cmd.join(' ');
  },
  installVirtualBoxCmd: function () {
    var packagejson = util.packagejson();
    return `installer -pkg ${this.escapePath(path.join(util.supportDir(), packagejson['virtualbox-filename']))} -target /`;
  },
  virtualBoxUrl: function () {
    var packagejson = util.packagejson();
    return `https://github.com/kitematic/virtualbox/releases/download/${packagejson['virtualbox-version']}/${packagejson['virtualbox-filename']}`;
  },
  macSudoCmd: function (cmd) {
    return `${this.escapePath(path.join(util.resourceDir(), 'macsudo'))} -p "Kitematic requires administrative privileges to install." sh -c \"${cmd}\"`;
  },
  simulateProgress: function (estimateSeconds, progress) {
    var times = _.range(0, estimateSeconds * 1000, 200);
    var timers = [];
    _.each(times, time => {
      var timer = setTimeout(() => {
        progress(100 * time / (estimateSeconds * 1000));
      }, time);
      timers.push(timer);
    });
  },
  checksum: function (filename) {
    return crypto.createHash('sha256').update(fs.readFileSync(filename), 'utf8').digest('hex');
  },
  download: function (url, filename, checksum, percentCallback) {
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
  },
  compareVersions: function (v1, v2, options) {
    var lexicographical = options && options.lexicographical,
    zeroExtend = options && options.zeroExtend,
    v1parts = v1.split('.'),
    v2parts = v2.split('.');

    function isValidPart(x) {
      return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
      return NaN;
    }

    if (zeroExtend) {
      while (v1parts.length < v2parts.length) {
        v1parts.push('0');
      }
      while (v2parts.length < v1parts.length) {
        v2parts.push('0');
      }
    }

    if (!lexicographical) {
      v1parts = v1parts.map(Number);
      v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
      if (v2parts.length === i) {
        return 1;
      }
      if (v1parts[i] === v2parts[i]) {
        continue;
      }
      else if (v1parts[i] > v2parts[i]) {
        return 1;
      }
      else {
        return -1;
      }
    }

    if (v1parts.length !== v2parts.length) {
      return -1;
    }

    return 0;
  }
};

module.exports = SetupUtil;
