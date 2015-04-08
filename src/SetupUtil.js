var _ = require('underscore');
var crypto = require('crypto');
var fs = require('fs-promise');
var path = require('path');
var request = require('request');
var progress = require('request-progress');
var Promise = require('bluebird');
var util = require('./Util');
var resources = require('./Resources');

var SetupUtil = {
  needsBinaryFix() {
    return !!(util.pathDoesNotExistOrDenied(util.binsPath()) || util.pathDoesNotExistOrDenied(util.dockerBinPath()) || util.pathDoesNotExistOrDenied(util.dockerMachineBinPath()));
  },
  escapePath(str) {
    return str.replace(/ /g, '\\ ').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  },
  shouldUpdateBinaries() {
    return !fs.existsSync(util.dockerBinPath()) ||
        !fs.existsSync(util.dockerMachineBinPath()) ||
        this.checksum(util.dockerMachineBinPath()) !== this.checksum(resources.docker_machine()) ||
        this.checksum(util.dockerBinPath()) !== this.checksum(resources.docker());

  },
  copyBinariesCmd: Promise.coroutine(function* () {
    yield fs.mkdirs(util.binsPath());
    yield fs.copy(resources.docker_machine(), util.dockerMachineBinPath());
    yield fs.copy(resources.docker(), util.dockerBinPath());
    return Promise.resolve();
  }),
  fixBinariesCmd: Promise.coroutine(function* () {
    if(util.isWindows()) {
      return;
    }

    yield fs.chown(util.binsPath(), process.getuid(), 80);
    yield fs.chown(util.dockerBinPath(), process.getuid(), 80);
    yield fs.chown(util.dockerMachineBinPath(), process.getuid(), 80);
    return Promise.resolve();
  }),
  installVirtualBoxCmd: Promise.coroutine(function* () {
    if(util.isWindows()) {
      yield util.execProper(`powershell.exe -ExecutionPolicy unrestricted -Command "Start-Process \\\"${path.join(util.supportDir(), this.virtualBoxFileName())}\\\" -ArgumentList \\\"--silent --msiparams REBOOT=ReallySuppress\\\" -Verb runAs -Wait"`);
    } else {
      yield util.exec(this.macSudoCmd(`installer -pkg ${this.escapePath(path.join(util.supportDir(), this.virtualBoxFileName()))} -target /`));
    }

    return Promise.resolve();
  }),
  virtualBoxUrl() {
    if(util.isWindows()) {
      return 'http://download.virtualbox.org/virtualbox/4.3.26/VirtualBox-4.3.26-98988-Win.exe';
    } else {
      return `https://github.com/kitematic/virtualbox/releases/download/${util.packagejson()['virtualbox-version']}/${this.virtualBoxFileName()}`;
    }
  },
  macSudoCmd(cmd) {
    return `${this.escapePath(resources.macsudo())} -p "Kitematic requires administrative privileges to install." sh -c \"${cmd}\"`;
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
  },
  virtualBoxFileName() {
    return util.isWindows() ? util.packagejson()['virtualbox-filename-win'] : util.packagejson()['virtualbox-filename'];
  },
  virtualBoxChecksum() {
    return util.isWindows() ? util.packagejson()['virtualbox-checksum-win'] : util.packagejson()['virtualbox-checksum'];
  },
  compareVersions(v1, v2, options) {
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
