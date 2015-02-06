var exec = require('exec');
var Promise = require('bluebird');

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
  }
};
