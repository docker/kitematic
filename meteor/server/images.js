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

rebuildImage = function (image, callback) {
  deleteFolder(image.path);
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
      deleteImageSync(image);
      deleteFolder(image.path);
      Images.remove({_id: image._id});
    } else {
      throw new Meteor.Error(400, 'This image is currently being used by <a href="/apps/' + app.name + '">' + app.name + "</a>.");
    }
  }
});
