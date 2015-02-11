var exec = require('exec');
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');

module.exports = {
  exec: function (args) {
    return new Promise((resolve, reject) => {
      exec(args, (stderr, stdout, code) => {
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
  packagejson: function () {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  }
};
