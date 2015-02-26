var exec = require('exec');
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');

module.exports = {
  exec: function (args, options) {
    options = options || {};
    return new Promise((resolve, reject) => {
      exec(args, options, (stderr, stdout, code) => {
        if (code) {
          reject(stderr);
        }
        resolve(stdout);
      });
    });
  },
  home: function () {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
  },
  supportDir: function () {
    var dirs = ['Library', 'Application\ Support', 'Kitematic'];
    var acc = process.env.HOME;
    dirs.forEach(function (d) {
      acc = path.join(acc, d);
      if (!fs.existsSync(acc)) {
        fs.mkdirSync(acc);
      }
    });
    return acc;
  },
  resourceDir: function () {
    return process.env.RESOURCES_PATH;
  },
  packagejson: function () {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  },
  copycmd: function (src, dest) {
    return ['rm', '-f', dest, '&&', 'cp', src, dest];
  },
  copyBinariesCmd: function () {
    var packagejson = this.packagejson();
    var cmd = ['mkdir', '-p', '/usr/local/bin'];
    cmd.push('&&');
    cmd.push.apply(cmd, this.copycmd(this.escapePath(path.join(this.resourceDir(), 'boot2docker-' + packagejson['boot2docker-version'])), '/usr/local/bin/boot2docker'));
    cmd.push('&&');
    cmd.push.apply(cmd, this.copycmd(this.escapePath(path.join(this.resourceDir(), 'docker-' + packagejson['docker-version'])), '/usr/local/bin/docker'));
    return cmd.join(' ');
  },
  fixBinariesCmd: function () {
    var cmd = [];
    cmd.push.apply(cmd, ['chown', `${process.getuid()}:${80}`, this.escapePath(path.join('/usr/local/bin', 'boot2docker'))]);
    cmd.push('&&');
    cmd.push.apply(cmd, ['chown', `${process.getuid()}:${80}`, this.escapePath(path.join('/usr/local/bin', 'docker'))]);
    return cmd.join(' ');
  },
  escapePath: function (str) {
    return str.replace(/ /g, '\\ ').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  },
  webPorts: ['80', '8000', '8080', '3000', '5000', '2368', '9200', '8983']
};
