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
  var KITE_VOLUMES_PATH = path.join(directory, 'volumes');
  if (fs.existsSync(KITE_VOLUMES_PATH)) {
    var destinationPath = path.join(KITE_PATH, appName);
    Util.copyFolder(KITE_VOLUMES_PATH, destinationPath);
    console.log('Copied volumes for: ' + appName);
  }
};
