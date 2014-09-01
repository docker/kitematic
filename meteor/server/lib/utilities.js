getHomePath = function () {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
};

getBinDir = function () {
  if (process.env.NODE_ENV === 'development') {
    return path.join(path.join(process.env.PWD, '..'), 'resources');
  } else {
    return path.join(process.cwd(), '../../../resources');
  }
};

deleteFolder = function (directory) {
  if (fs.existsSync(directory)) {
    fs.readdirSync(directory).forEach(function (file) {
      var curDirectory = directory + '/' + file;
      if (fs.lstatSync(curDirectory).isDirectory()) {
        // Recurse
        deleteFolder(curDirectory);
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

copyFolder = function (src, dest) {
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
      copyFolder(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    try {
      fs.linkSync(src, dest);
    } catch (e) {
      console.error(e);
    }
  }
};

getImageJSON = function (directory) {
  var KITE_JSON_PATH = path.join(directory, 'image.json');
  if (fs.existsSync(KITE_JSON_PATH)) {
    var data = fs.readFileSync(KITE_JSON_PATH, 'utf8');
    return JSON.parse(data);
  } else {
    return null;
  }
};

copyVolumes = function (directory, appName) {
  var KITE_VOLUMES_PATH = path.join(directory, 'volumes');
  if (fs.existsSync(KITE_VOLUMES_PATH)) {
    var destinationPath = path.join(KITE_PATH, appName);
    copyFolder(KITE_VOLUMES_PATH, destinationPath);
    console.log('Copied volumes for: ' + appName);
  }
};

saveImageFolder = function (directory, imageId, callback) {
  var destinationPath = path.join(KITE_IMAGES_PATH, imageId);
  if (!fs.existsSync(destinationPath)) {
    fs.mkdirSync(destinationPath, function (err) {
      if (err) { callback(err); return; }
    });
    copyFolder(directory, destinationPath);
    console.log('Copied image folder for: ' + imageId);
    callback(null);
  }
};

saveImageFolderSync = function (directory, imageId) {
  return Meteor._wrapAsync(saveImageFolder)(directory, imageId);
};
