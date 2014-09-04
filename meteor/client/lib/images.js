ImageUtil = {};

var createTarFile = function (image, callback) {
  var TAR_PATH = path.join(KITE_TAR_PATH, image._id + '.tar');
  exec('tar czf ' + TAR_PATH + ' -C ' + image.path + ' .', function (err) {
    if (err) { callback(err, null); return; }
    console.log('Created tar file: ' + TAR_PATH);
    callback(null, TAR_PATH);
  });
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

ImageUtil.getMetaData = function (directory) {
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

ImageUtil.saveFolder = function (directory, imageId, callback) {
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

ImageUtil.rebuildHelper = function (image, callback) {
  Util.deleteFolder(image.path);
  var imageMetaData = ImageUtil.getMetaData(image.originPath);
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
  ImageUtil.saveFolder(image.originPath, image._id, function (err) {
    if (err) { console.error(err); }
    ImageUtil.pull(fs.readFileSync(path.join(image.path, 'Dockerfile'), 'utf8'), image._id, function (err) {
      if (err) { callback(err, null); return; }
      ImageUtil.build(image, function (err) {
        if (err) { console.error(err); }
        callback(null, null);
      });
    });
  });
};

ImageUtil.rebuild = function (imageId) {
  var image = Images.findOne(imageId);
  if (!image) {
    throw new Meteor.Error(403, "No image found with this ID.");
  }
  var apps = Apps.find({imageId: imageId}).fetch();
  if (apps.length > 0) {
    _.each(apps, function (app) {
      console.log('Updating app: ' + app.name);
      if (app.docker) {
        Docker.removeContainer(app.docker.Id, function (err) {
          if (err) { console.error(err); }
        });
      }
      Apps.update(app._id, {
        $set: {
          'docker.Id': null,
          status: 'STARTING',
          logs: []
        }
      });
    });
    ImageUtil.rebuildHelper(image, function (err) {
      if (err) { console.error(err); }
    });
    _.each(apps, function (app) {
      app = Apps.findOne(app._id);
      AppUtil.run(app, function (err) {
        if (err) { console.error(err); }
      });
    });
  } else {
    ImageUtil.rebuildHelper(image, function (err) {
      if (err) { console.error(err); }
    });
  }
},

ImageUtil.pull = function (dockerfile, imageId, callback) {
  var fromImage = getFromImage(dockerfile);
  console.log('From image: ' + fromImage);
  var installedImage = null;
  Docker.getImageData(imageId, function (err, data) {
    if (err) { console.error(err); }
    installedImage = data;
    if (fromImage && !installedImage) {
      Images.update(imageId, {
        $set: {
          buildLogs: []
        }
      });
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
            Images.update(imageId, {
              $set: {
                buildLogs: logs
              }
            });
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
  });
};

ImageUtil.build = function (image, callback) {
  createTarFile(image, function (err, tarFilePath) {
    if (err) { console.error(err); }
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
          Images.update(image._id, {
            $set: {
              buildLogs: logs
            }
          });
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
        var imageData = null;
        Docker.getImageData(image._id, function (err, data) {
          if (err) {
            Images.update(image._id, {
              $set: {
                status: 'ERROR'
              }
            });
          } else {
            imageData = data;
            Images.update(image._id, {
              $set: {
                docker: imageData,
                status: 'READY'
              }
            });
            var oldImageId = null;
            if (image.docker && image.docker.Id) {
              oldImageId = image.docker.Id;
            }
            if (oldImageId && imageData && oldImageId !== imageData.Id) {
              Docker.removeImage(oldImageId, function (err) {
                if (err) { console.error(err); }
              });
            }
          }
          callback(null);
        });
      });
    });
  });
};
