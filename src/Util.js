var exec = require('exec');
var execProper = require('child_process').exec;
var Promise = require('bluebird');
var fs = require('fs-promise');
var path = require('path');
var open = require('open');

module.exports = {
  exec(args, options) {
    options = options || {};
    return new Promise((resolve, reject) => {
      exec(args, options, (stderr, stdout, code) => {
        if (code) {
          var cmd = Array.isArray(args) ? args.join(' ') : args;
          reject(new Error(cmd + ' returned non zero exit code\nstdout:' + stdout + '\nstderr:' + stderr));
        } else {
          resolve(stdout);
        }
      });
    });
  },
  execProper(args, options) {
    options = options || {};
    var cmd = Array.isArray(args) ? args.join(' ') : args;
    return new Promise((resolve, reject) => {
      execProper(cmd, options, (stderr, stdout, code) => {
        if (code) {
          reject(new Error(cmd + ' returned non zero exit code\nstdout:' + stdout + '\nstderr:' + stderr));
        } else {
          resolve(stdout);
        }
      });
    });
  },
  home() {
    return process.env[this.isWindows() ? 'USERPROFILE' : 'HOME'];
  },
  binsPath() {
    return this.isWindows() ? path.join(this.home(), 'Kitematic-bins') : path.join('/usr/local/bin');
  },
  binsEnding() {
    return this.isWindows() ? '.exe' : '';
  },
  dockerBinPath() {
    return path.join(this.binsPath(), 'docker' + this.binsEnding());
  },
  dockerMachineBinPath() {
    return path.join(this.binsPath(), 'docker-machine' + this.binsEnding());
  },
  pathDoesNotExistOrDenied(path) {
    if(this.isWindows()) {
      return (!fs.existsSync(path));
    } else {
      return (!fs.existsSync(path) || fs.statSync(path).gid !== 80 || fs.statSync(path).uid !== process.getuid());
    }
  },
  openPathOrUrl(pathOrUrl, callback) {
    open(pathOrUrl, callback);
  },
  supportDir() {
    var acc = path.join(this.home(), 'Library', 'Application\ Support', 'Kitematic');
    fs.mkdirsSync(acc);
    return acc;
  },
  packagejson() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  },
  settingsjson() {
    var settingsjson = {};
    try {
      settingsjson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'settings.json'), 'utf8'));
    } catch (err) {}
    return settingsjson;
  },
  isWindows() {
    return process.platform === 'win32';
  },
  CommandOrCtrl() {
    return this.isWindows() ? 'Ctrl' : 'Command';
  },
  webPorts: ['80', '8000', '8080', '3000', '5000', '2368', '9200', '8983']
};
