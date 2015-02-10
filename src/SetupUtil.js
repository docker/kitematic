var request = require('request');
var progress = require('request-progress');
var path = require('path');
var crypto = require('crypto');
var fs = require('fs');
var exec = require('exec');
var Promise = require('bluebird');

var SetupUtil = {
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
  isSudo: function () {
    return new Promise((resolve, reject) => {
      exec(['sudo', '-n', '-u', 'root', 'true'], (stderr, stdout, code) => {
        if (code) {
          reject(stderr);
        }
        resolve(stderr.indexOf('a password is required') === -1);
      });
    });
  },
  download: function (url, filename, checksum, percentCallback) {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(filename)) {
        var existingChecksum = crypto.createHash('sha256').update(fs.readFileSync(filename), 'utf8').digest('hex');
        if (existingChecksum === checksum) {
          resolve();
        } else {
          fs.unlinkSync(filename);
        }
      }

      progress(request({ uri: url, rejectUnauthorized: false }), { throttle: 250 }).on('progress', state => {
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
