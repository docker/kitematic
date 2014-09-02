var createTarFile = function (image, callback) {
  var TAR_PATH = path.join(KITE_TAR_PATH, image._id + '.tar');
  exec('tar czf ' + TAR_PATH + ' -C ' + image.path + ' .', function (err) {
    if (err) { callback(err, null); return; }
    console.log('Created tar file: ' + TAR_PATH);
    callback(null, TAR_PATH);
  });
};

var createTarFileSync = function (image) {
  return Meteor._wrapAsync(createTarFile)(image);
};

var getFromImage = function (dockerfile) {
  var patternString = "(FROM)(.*)";
  var regex = new RegExp(patternString, "g");
  var fromInstruction = dockerfile.match(regex);
  if (fromInstruction && fromInstruction.length > 0) {
    return fromInstruction[0].replace('FROM', '').trim();
  } else {
    return null;
  }
};

var getImageJSON = function (directory) {
  var KITE_JSON_PATH = path.join(directory, 'image.json');
  if (fs.existsSync(KITE_JSON_PATH)) {
    var data = fs.readFileSync(KITE_JSON_PATH, 'utf8');
    return JSON.parse(data);
  } else {
    return null;
  }
};

var getImageMetaData = function (directory) {
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

Images.saveFolder = function (directory, imageId, callback) {
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

Images.saveFolderSync = function (directory, imageId) {
  return Meteor._wrapAsync(Images.saveFolder)(directory, imageId);
};

Images.rebuild = function (image, callback) {
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
  Images.saveFolderSync(image.originPath, image._id);
  Images.pull(fs.readFileSync(path.join(image.path, 'Dockerfile'), 'utf8'), image._id, function (err) {
    if (err) { callback(err, null); return; }
    Images.build(image, function (err) {
      if (err) { console.error(err); }
      callback(null, null);
    });
  });
};

Images.rebuildSync = function (image) {
  return Meteor._wrapAsync(Images.rebuild)(image);
};

Images.pull = function (dockerfile, imageId, callback) {
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

Images.build = function (image, callback) {
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
    Images.insert(imageObj);
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
        if (app.docker) {
          try {
            Docker.removeContainerSync(app.docker.Id);
          } catch (e) {
            console.error(e);
          }
        }
        Apps.update(app._id, {
          $set: {
            'docker.Id': null,
            status: 'STARTING',
            logs: []
          }
        });
      });
      Images.rebuildSync(image);
      _.each(apps, function (app) {
        app = Apps.findOne(app._id);
        Meteor.call('runApp', app, function (err) {
          if (err) { console.error(err); }
        });
      });
    } else {
      Images.rebuildSync(image);
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
    if (!Util.hasDockerfile(directory)) {
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
      Images.remove({_id: image._id});
    } else {
      throw new Meteor.Error(400, 'This image is currently being used by <a href="/apps/' + app.name + '">' + app.name + "</a>.");
    }
  }
});
