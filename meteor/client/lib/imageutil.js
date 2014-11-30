var Convert = require('ansi-to-html');
var convert = new Convert();
var exec = require('exec');
var path = require('path');
var fs = require('fs');
var async = require('async');

ImageUtil = {};

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

ImageUtil.rebuildHelper = function (image, callback) {
  var imageMetaData = ImageUtil.getMetaData(image.path);
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
  ImageUtil.pull(fs.readFileSync(path.join(image.path, 'Dockerfile'), 'utf8'), image._id, function (err) {
    if (err) { callback(err, null); return; }
    ImageUtil.build(image, function (err) {
      if (err) { console.error(err); }
      callback(null, null);
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
  Util.createTarFile(image.path, path.join(Util.KITE_TAR_PATH, image._id + '.tar'), function (err, tarFilePath) {
    if (err) { console.error(err); }
    Images.update(image._id, {
      $set: {
        buildLogs: []
      }
    });
    Docker.client().buildImage(tarFilePath, {forcerm: true, t: image.meta.name + ':' + image.meta.version}, function (err, response) {
      if (err) { callback(err); return; }
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
          // Ignore misc conversion errors
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
};

ImageUtil.sync = function (callback) {
  Docker.listImages({all: 0}, function (err, dockerImages) {
    if (err) {
      callback(err);
      return;
    }
    var images = Images.find({}).fetch();

    // Delete missing GUI images
    var kitematicIds = _.map(images, function (image) {
      if (image.docker && image.docker.Id) {
        return image.docker.Id;
      }
    });
    var daemonIds = _.map(dockerImages, function (image) {
      return image.Id;
    });
    var diffImages = _.difference(kitematicIds, daemonIds);
    _.each(diffImages, function (imageId) {
      var image = Images.findOne({'docker.Id': imageId});
      if (image && image.status !== 'BUILDING') {
        Images.remove(image._id);
      }
    });

    // Add missing Daemon images
    var diffDockerImages = _.reject(dockerImages, function (image) {
      return _.contains(kitematicIds, image.Id);
    });
    _.each(diffDockerImages, function (image) {
      if (!image.RepoTags || _.isEmpty(image.Config.ExposedPorts)) {
        return;
      }

      var meta = {};
      var repoTag = _.first(image.RepoTags);
      var repoTagTokens = repoTag.split(':');
      var name = repoTagTokens[0];
      var version = repoTagTokens[1];
      meta = {
        name: name,
        version: version
      };
      var buildingImage = _.find(images, function (image) {
        return image.status === 'BUILDING' && image.meta.name === name && image.meta.version === version;
      });
      if (!buildingImage) {
        var imageObj = {
          status: 'READY',
          docker: image,
          buildLogs: [],
          createdAt: new Date(),
          tags: image.RepoTags,
          meta: meta
        };
        Images.insert(imageObj);
      }
    });

    async.each(images, function (image, callback) {
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
          if (err) {callback(err); return;}
          Images.update(image._id, {
            $set: {
              docker: data
            }
          });
          callback();
        });
      } else {
        callback();
      }
    }, function (err) {
      callback(err);
    });
  });
};
