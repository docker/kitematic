var path = require('path');
var fs = require('fs');

Util = {};

Util.getHomePath = function () {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
};

Util.getBinDir = function () {
  if (process.env.NODE_ENV === 'development') {
    return path.join(path.join(process.env.PWD, '..'), 'resources');
  } else {
    if (Meteor.isClient) {
      return path.join(process.cwd(), 'resources');
    } else {
      return path.join(process.cwd(), '../../../resources');
    }
  }
};

Util.KITE_PATH = path.join(Util.getHomePath(), 'Kitematic');
Util.KITE_TAR_PATH = path.join(Util.KITE_PATH, '.tar');
Util.KITE_IMAGES_PATH = path.join(Util.KITE_PATH, '.images');

Util.deleteFolder = function (directory) {
  if (fs.existsSync(directory)) {
    fs.readdirSync(directory).forEach(function (file) {
      var curDirectory = directory + '/' + file;
      if (fs.lstatSync(curDirectory).isDirectory()) {
        // Recurse
        Util.deleteFolder(curDirectory);
      } else {
        // Delete File
        try {
          fs.unlinkSync(curDirectory);
        } catch (e) {
          console.error(e);
        }
      }
    });
    fs.rmdirSync(directory);
  }
};

Util.copyFolder = function (src, dest) {
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (exists && isDirectory) {
    try {
      fs.mkdirSync(dest);
    } catch (e) {
      console.error(e);
    }
    fs.readdirSync(src).forEach(function (childItemName) {
      Util.copyFolder(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    try {
      fs.linkSync(src, dest);
    } catch (e) {
      console.error(e);
    }
  }
};

Util.copyVolumes = function (directory, appName) {
  var volumesPath = path.join(directory, 'volumes');
  if (fs.existsSync(volumesPath)) {
    var destinationPath = path.join(Util.KITE_PATH, appName);
    Util.copyFolder(volumesPath, destinationPath);
    console.log('Copied volumes for: ' + appName);
  }
};

Util.hasDockerfile = function (directory) {
  return fs.existsSync(path.join(directory, 'Dockerfile'));
};

/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * @param {string} v1 The first version to be compared.
 * @param {string} v2 The second version to be compared.
 * @param {object} [options] Optional flags that affect comparison behavior:
 * <ul>
 *     <li>
 *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
 *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
 *         "1.2".
 *     </li>
 *     <li>
 *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
 *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
 *     </li>
 * </ul>
 * @returns {number|NaN}
 * <ul>
 *    <li>0 if the versions are equal</li>
 *    <li>a negative integer iff v1 < v2</li>
 *    <li>a positive integer iff v1 > v2</li>
 *    <li>NaN if either version string is in the wrong format</li>
 * </ul>
 *
 */
Util.compareVersions = function (v1, v2, options) {
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
};

trackLink = function (trackLabel) {
  var install = Installs.findOne({});
  if (install && install.tracking) {
    if (trackLabel) {
      console.log(trackLabel);
      ga('send', 'event', 'link', 'click', trackLabel);
    }
  }
};
