getFromImage = function (dockerfile) {
  var patternString = "(FROM)(.*)";
  var regex = new RegExp(patternString, "g");
  var fromInstruction = dockerfile.match(regex);
  if (fromInstruction && fromInstruction.length > 0) {
    return fromInstruction[0].replace('FROM', '').trim();
  } else {
    return null;
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

saveImageFolder = function (directory, imageId, callback) {
  var destinationPath = path.join(KITE_IMAGES_PATH, imageId);
  if (!fs.existsSync(destinationPath)) {
    fs.mkdirSync(destinationPath, function (err) {
      if (err) { callback(err); return; }
    });
    Util.copyFolder(directory, destinationPath);
    console.log('Copied image folder for: ' + imageId);
    callback(null);
  }
};

saveImageFolderSync = function (directory, imageId) {
  return Meteor._wrapAsync(saveImageFolder)(directory, imageId);
};

getImageMetaData = function (directory) {
  var kiteJSON = getImageJSON(directory);
  if (kiteJSON) {
    if (!kiteJSON.name) {
      kiteJSON.name = _.last(directory.split(path.sep));
    }
  } else {
    kiteJSON = {
      name: _.last(directory.split(path.sep))
    };
  }
  return kiteJSON;
};

deleteImage = function (image, callback) {
  if (!image.docker) {
    callback(null, {});
    return;
  }
  try {
    Docker.removeImageSync(image.docker.Id);
  } catch (e) {
    console.error(e);
  }
  callback(null);
};

deleteImageSync = function (image) {
  return Meteor._wrapAsync(deleteImage)(image);
};

rebuildImage = function (image, callback) {
  Util.deleteFolder(image.path);
  var imageMetaData = getImageMetaData(image.originPath);
  if (imageMetaData.logo) {
    Images.update(image._id, {
      $set: {
        logoPath: path.join(image.path, imageMetaData.logo)
      }
    });
  } else {
    Images.update(image._id, {
      $set: {
        logoPath: null
      }
    });
  }
  Images.update(image._id, {
    $set: {
      status: 'BUILDING',
      meta: imageMetaData
    }
  });
  image = Images.findOne(image._id);
  saveImageFolderSync(image.originPath, image._id);
  pullImageFromDockerfile(fs.readFileSync(path.join(image.path, 'Dockerfile'), 'utf8'), image._id, function (err) {
    if (err) { callback(err, null); return; }
    buildImage(image, function (err) {
      if (err) { console.error(err); }
      callback(null, null);
    });
  });
};

rebuildImageSync = function (image) {
  return Meteor._wrapAsync(rebuildImage)(image);
};

pullImageFromDockerfile = function (dockerfile, imageId, callback) {
  var fromImage = getFromImage(dockerfile);
  console.log('From image: ' + fromImage);
  var installedImage = null;
  try {
    installedImage = Docker.getImageDataSync(fromImage);
  } catch (e) {
    console.error(e);
  }
  if (fromImage && !installedImage) {
    Fiber(function () {
      Images.update(imageId, {
        $set: {
          buildLogs: []
        }
      });
    }).run();
    var logs = [];
    docker.pull(fromImage, function (err, response) {
      if (err) { callback(err); return; }
      response.setEncoding('utf8');
      response.on('data', function (data) {
        try {
          var logData = JSON.parse(data);
          var logDisplay = '';
          if (logData.id) {
            logDisplay += logData.id + ' | ';
          }
          logDisplay += logData.status;
          if (logData.progressDetail && logData.progressDetail.current && logData.progressDetail.total) {
            logDisplay += ' - ' + Math.round(logData.progressDetail.current / logData.progressDetail.total * 100) + '%';
          }
          logs.push(logDisplay);
          Fiber(function () {
            Images.update(imageId, {
              $set: {
                buildLogs: logs
              }
            });
          }).run();
        } catch (e) {
          console.error(e);
        }
      });
      response.on('end', function () {
        console.log('Finished pulling image: ' + fromImage);
        callback(null);
      });
    });
  } else {
    callback(null);
  }
};

buildImage = function (image, callback) {
  Fiber(function () {
    var tarFilePath = createTarFileSync(image);
    Images.update(image._id, {
      $set: {
        buildLogs: []
      }
    });
    docker.buildImage(tarFilePath, {t: image._id.toLowerCase()}, function (err, response) {
      if (err) { callback(err); }
      console.log('Building Docker image...');
      var logs = [];
      response.setEncoding('utf8');
      response.on('data', function (data) {
        try {
          var line = JSON.parse(data).stream;
          logs.push(convert.toHtml(line));
          Fiber(function () {
            Images.update(image._id, {
              $set: {
                buildLogs: logs
              }
            });
          }).run();
        } catch (e) {
          console.error(e);
        }
      });
      response.on('end', function () {
        console.log('Finished building Docker image.');
        try {
          fs.unlinkSync(tarFilePath);
          console.log('Cleaned up tar file.');
        } catch (e) {
          console.error(e);
        }
        Fiber(function () {
          var imageData = null;
          try {
            imageData = Docker.getImageDataSync(image._id);
            Images.update(image._id, {
              $set: {
                docker: imageData,
                status: 'READY'
              }
            });
          } catch (e) {
            console.log(e);
            Images.update(image._id, {
              $set: {
                status: 'ERROR'
              }
            });
          }
          var oldImageId = null;
          if (image.docker && image.docker.Id) {
            oldImageId = image.docker.Id;
          }
          if (oldImageId && imageData && oldImageId !== imageData.Id) {
            try {
              Docker.removeImageSync(oldImageId);
            } catch (e) {
              console.error(e);
            }
          }
        }).run();
        callback(null);
      });
    });
  }).run();
};

Meteor.methods({
  createImage: function (directory) {
    this.unblock();
    var imageObj = {
      status: 'BUILDING',
      originPath: directory
    };
    var imageMetaData = getImageMetaData(directory);
    imageObj.meta = imageMetaData;
    var imageId = Images.insert(imageObj);
    var imagePath = path.join(KITE_IMAGES_PATH, imageId);
    Images.update(imageId, {
      $set: {
        path: imagePath
      }
    });
    if (imageObj.meta.logo) {
      Images.update(imageId, {
        $set: {
          logoPath: path.join(imagePath, imageObj.meta.logo)
        }
      });
    }
    var image = Images.findOne(imageId);
    saveImageFolderSync(directory, imageId);
    console.log('Saved folder sync');
    pullImageFromDockerfile(fs.readFileSync(path.join(image.path, 'Dockerfile'), 'utf8'), imageId, function (err) {
      if (err) { throw err; }
      buildImage(image, function (err) {
        if (err) { console.error(err); }
      });
    });
  },
  rebuildImage: function (imageId) {
    this.unblock();
    var image = Images.findOne(imageId);
    if (!image) {
      throw new Meteor.Error(403, "No image found with this ID.");
    }
    var apps = Apps.find({imageId: imageId}).fetch();
    if (apps.length > 0) {
      _.each(apps, function (app) {
        console.log('Updating app: ' + app.name);
        deleteAppSync(app);
        Apps.update(app._id, {
          $set: {
            'docker.Id': null,
            status: 'STARTING',
            logs: []
          }
        });
      });
      rebuildImageSync(image);
      _.each(apps, function (app) {
        app = Apps.findOne(app._id);
        Meteor.call('runApp', app, function (err) {
          if (err) { console.error(err); }
        });
      });
    } else {
      rebuildImageSync(image);
    }
  },
  changeDirectory: function (imageId, directory) {
    this.unblock();
    var image = Images.findOne(imageId);
    if (!image) {
      throw new Meteor.Error(403, "No image found with this ID.");
    }
    Images.update(imageId, {
      $set: {
        originPath: directory
      }
    });
  },
  validateDirectory: function (directory) {
    this.unblock();
    if (!hasDockerfile(directory)) {
      throw new Meteor.Error(400, "Only directories with Dockerfiles are supported now.");
    }
  },
  deleteImage: function (imageId) {
    this.unblock();
    var image = Images.findOne(imageId);
    if (!image) {
      throw new Meteor.Error(403, "No image found with this ID.");
    }
    var app = Apps.findOne({imageId: imageId});
    if (!app) {
      console.log('here');
      try {
        deleteImageSync(image);
        Util.deleteFolder(image.path);
      } catch (e) {
        console.log(e);
      } finally {
        Images.remove({_id: image._id});
      }
    } else {
      throw new Meteor.Error(400, 'This image is currently being used by <a href="/apps/' + app.name + '">' + app.name + "</a>.");
    }
  }
});
