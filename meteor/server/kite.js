KITE_PATH = path.join(getHomePath(), 'Kitematic');
KITE_TAR_PATH = path.join(KITE_PATH, '.tar');
KITE_IMAGES_PATH = path.join(KITE_PATH, '.images');

if (!fs.existsSync(KITE_PATH)) {
  console.log('Created Kitematic directory.');
  fs.mkdirSync(KITE_PATH, function (err) {
    if (err) { throw err; }
  });
}

if (!fs.existsSync(KITE_TAR_PATH)) {
  console.log('Created Kitematic .tar directory.');
  fs.mkdirSync(KITE_TAR_PATH, function (err) {
    if (err) { throw err; }
  });
}

if (!fs.existsSync(KITE_IMAGES_PATH)) {
  console.log('Created Kitematic .images directory.');
  fs.mkdirSync(KITE_IMAGES_PATH, function (err) {
    if (err) { throw err; }
  });
}

getImageJSON = function (directory) {
  var KITE_JSON_PATH = path.join(directory, 'image.json');
  if (fs.existsSync(KITE_JSON_PATH)) {
    var data = fs.readFileSync(KITE_JSON_PATH, 'utf8');
    return JSON.parse(data);
  } else {
    return null;
  }
};

loadKiteVolumes = function (directory, appName) {
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
