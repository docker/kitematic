var path = require('path');
var fs = require('fs');
var nodeCrypto = require('crypto');
var request = require('request');
var progress = require('request-progress');
var exec = require('exec');

var Util = {
  download: function (url, filename, checksum, callback, progressCallback) {
    var doDownload = function () {
      progress(request(url), {
        throttle: 250
      }).on('progress', function (state) {
        progressCallback(state.percent);
      }).on('error', function (err) {
        callback(err);
      }).pipe(fs.createWriteStream(filename)).on('error', function (err) {
        callback(err);
      }).on('close', function (err) {
        callback(err);
      });
    };

    // Compare checksum to see if it already exists first
    if (fs.existsSync(filename)) {
      var existingChecksum = nodeCrypto.createHash('sha256').update(fs.readFileSync(filename), 'utf8').digest('hex');
      console.log(existingChecksum);
      if (existingChecksum !== checksum) {
        fs.unlinkSync(filename);
        doDownload();
      } else {
        callback();
      }
    } else {
      doDownload();
    }
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

module.exports = Util;
