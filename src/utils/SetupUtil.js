var _ = require('underscore');
var crypto = require('crypto');
var fs = require('fs-promise');
var path = require('path');
var request = require('request');
var progress = require('request-progress');
var Promise = require('bluebird');
var util = require('./Util');
var resources = require('./ResourcesUtil');

var SetupUtil = {
  needsBinaryFix() {
    return !!(util.pathDoesNotExistOrDenied(util.binsPath()) || util.pathDoesNotExistOrDenied(util.dockerBinPath()) || util.pathDoesNotExistOrDenied(util.dockerMachineBinPath()));
  },
  pathDoesNotExistOrDenied: function (path) {
    if(util.isWindows()) {
      return (!fs.existsSync(path));
    } else {
      return (!fs.existsSync(path) || fs.statSync(path).gid !== 80 || fs.statSync(path).uid !== process.getuid());
    }
  },
  escapePath(str) {
    return str.replace(/ /g, '\\ ').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  },
  shouldUpdateBinaries() {
    return !fs.existsSync(util.dockerBinPath()) ||
        !fs.existsSync(util.dockerMachineBinPath()) ||
        this.checksum(util.dockerMachineBinPath()) !== this.checksum(resources.dockerMachine()) ||
        this.checksum(util.dockerBinPath()) !== this.checksum(resources.docker());

  },
  copyBinariesCmd: Promise.coroutine(function* () {
    yield fs.mkdirs(util.binsPath());
    yield fs.copy(resources.dockerMachine(), util.dockerMachineBinPath());
    yield fs.copy(resources.docker(), util.dockerBinPath());
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
  }
};

module.exports = SetupUtil;
