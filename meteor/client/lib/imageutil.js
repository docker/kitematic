var Convert = require('ansi-to-html');
var convert = new Convert();
var exec = require('exec');
var path = require('path');
var fs = require('fs');

var docker = Docker.client();

ImageUtil = {};

var createTarFile = function (image, callback) {
  var TAR_PATH = path.join(Util.KITE_TAR_PATH, image._id + '.tar');
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
  var jsonPath = path.join(directory, 'image.json');
  if (fs.existsSync(jsonPath)) {
    var data = fs.readFileSync(jsonPath, 'utf8');
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
    if (!kiteJSON.version) {
      kiteJSON.version = 'latest';
    }
  } else {
    kiteJSON = {
      name: _.last(directory.split(path.sep)),
      version: 'latest'
    };
  }
  return kiteJSON;
};

ImageUtil.saveFolder = function (directory, imageId, callback) {
  var destinationPath = path.join(Util.KITE_IMAGES_PATH, imageId);
  if (!fs.existsSync(destinationPath)) {
    fs.mkdirSync(destinationPath, function (err) {
      if (err) { callback(err); return; }
    });
    Util.copyFolder(directory, destinationPath, function (err) {
      if (err) { callback(err); return; }
      console.log('Copied image folder for: ' + imageId);
      callback(null);
    });
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
      _.each(apps, function (app) {
        app = Apps.findOne(app._id);
        AppUtil.run(app, function (err) {
          if (err) { console.error(err); }
        });
      });
    });
  } else {
    ImageUtil.rebuildHelper(image, function (err) {
      if (err) { console.error(err); }
    });
  }
};

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
      Docker.client().pull(fromImage, function (err, response) {
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
    Docker.client().buildImage(tarFilePath, {t: image.meta.name + ':' + image.meta.version}, function (err, response) {
      if (err) { callback(err); }
      console.log('Building Docker image...');
      response.setEncoding('utf8');
      response.on('data', function (data) {
        try {
          var line = JSON.parse(data).stream;
          Images.update(image._id, {
            $push: {
              buildLogs: convert.toHtml(line)
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
        Docker.getImageData(image.meta.name + ':' + image.meta.version, function (err, data) {
          console.log(data);
          if (err) {
            console.error(err);
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

ImageUtil.remove = function (imageId) {
  var image = Images.findOne(imageId);
  Images.remove({_id: image._id});
  if (image.docker) {
    Docker.removeImage(image.docker.Id, function (err) {
      if (err) { console.error(err); }
    });
  }
  try {
    Util.deleteFolder(image.path);
  } catch (e) {
    console.error(e);
  }
  Sync.removeAppWatcher(imageId);
};

ImageUtil.sync = function () {
  Docker.listImages(function (err, dockerImages) {
    if (err) {
      console.error(err);
    } else {
      var images = Images.find({}).fetch();
      _.each(images, function (image) {
        var image = Images.findOne(image._id);
        if (image && image.docker && image.docker.Id) {
          var duplicateImages = Images.find({'docker.Id': image.docker.Id, _id: {$ne: image._id}}).fetch();
          _.each(duplicateImages, function (duplicateImage) {
            Images.remove(duplicateImage._id);
          });
          var imageData = _.find(dockerImages, function (dockerImage) {
            return dockerImage.Id === image.docker.Id;
          });
          if (imageData && imageData.RepoTags) {
            Images.update(image._id, {
              $set: {
                tags: imageData.RepoTags
              }
            });
          }
          Docker.getImageData(image.docker.Id, function (err, data) {
            Images.update(image._id, {
              $set: {
                docker: data
              }
            })
          });
        }
      });
      var dockerIds = _.map(images, function (image) {
        if (image.docker && image.docker.Id) {
          return image.docker.Id;
        }
      });
      var imageIds = _.map(dockerImages, function (image) {
        return image.Id;
      });
      var diffImages = _.difference(dockerIds, imageIds);
      _.each(diffImages, function (imageId) {
        var image = Images.findOne({'docker.Id': imageId});
        if (image && image.status !== 'BUILDING') {
          ImageUtil.remove(image._id);
        }
      });
      var diffDockerImages = _.reject(dockerImages, function (image) {
        return _.contains(dockerIds, image.Id);
      });
      _.each(diffDockerImages, function (image) {
        var repoTag = _.first(image.RepoTags);
        var repoTagTokens = repoTag.split(':');
        var name = repoTagTokens[0];
        var version = repoTagTokens[1];
        var buildingImage = _.find(images, function (image) {
          return image.status === 'BUILDING' && image.meta.name === name && image.meta.version === version;
        });
        if (!buildingImage && name !== '<none>' && version !== '<none>' && name !== 'kite-dns') {
          var imageObj = {
            status: 'READY',
            docker: image,
            buildLogs: [],
            createdAt: new Date(),
            tags: image.RepoTags,
            meta: {
              name: name,
              version: version
            }
          };
          console.log(imageObj);
          Images.insert(imageObj);
        }
      });
    }
  });
};
