removeBindFolder = function (name, callback) {
  exec(path.join(getBinDir(), 'boot2docker') + ' ssh "sudo rm -rf /var/lib/docker/binds/' + name + '"', function(err, stdout) {
    callback(err, stdout);
  });
};

recoverApps = function (callback) {
  var apps = Apps.find({}).fetch();
  _.each(apps, function (app) {
    // Update the app with the latest container info
    if (!app.docker) {
      return;
    }
    var container = docker.getContainer(app.docker.Id);
    container.inspect(function (err, data) {
      if (app.status !== 'STARTING' && data && data.State && !data.State.Running) {
        console.log('restarting: ' + app.name);
        console.log(app.docker.Id);
        Fiber(function () {
          restartApp(app, function (err) {
            if (err) { console.error(err); }
          });
        }).run();
      }
    });
  });
  callback();
};

Meteor.methods({
  recoverApps: function () {
    return Meteor._wrapAsync(recoverApps)();
  },
  configVar: function (appId, configVars) {
    this.unblock();
    Apps.update(appId, {$set: {
      config: configVars,
      status: 'STARTING'
    }});
    var app = Apps.findOne({_id: appId});
    Meteor.call('runApp', app, function (err) {
      if (err) { console.error(err); }
    });
  },
  deleteApp: function (appId) {
    this.unblock();
    var app = Apps.findOne(appId);
    if (!app) {
      throw new Meteor.Error(403, 'No app found with this ID');
    }
    deleteApp(app, function (err) {
      if (err) { console.error(err); }
      var appPath = path.join(KITE_PATH, app.name);
      deleteFolder(appPath);
      removeBindFolder(app.name, function () {
        console.log('Deleted Kite ' + app.name + ' directory.');
        Fiber(function () {
          Apps.remove({_id: app._id});
        }).run();
      });
    });
  },
  createApp: function (formData) {
    var validationResult = formValidate(formData, FormSchema.formCreateApp);
    if (validationResult.errors) {
      throw new Meteor.Error(400, 'Validation Failed.', validationResult.errors);
    } else {
      var cleaned = validationResult.cleaned;
      var appObj = {
        name: cleaned.name,
        imageId: cleaned.imageId,
        status: 'STARTING',
        config: {}
      };
      var appId = Apps.insert(appObj);
      var appPath = path.join(KITE_PATH, appObj.name);
      if (!fs.existsSync(appPath)) {
        console.log('Created Kite ' + appObj.name + ' directory.');
        fs.mkdirSync(appPath, function (err) {
          if (err) { throw err; }
        });
      }
      Apps.update(appId, {
        $set: {
          'config.APP_ID': appId,
          path: appPath
        }
      });
      var image = Images.findOne(appObj.imageId);
      loadKiteVolumes(image.path, appObj.name);
      var app = Apps.findOne(appId);
      removeBindFolder(app.name, function (err) {
        if (err) {
          console.error(err);
        }
        Fiber(function () {
          Meteor.call('runApp', app, function (err) {
            if (err) { throw err; }
          });
        }).run();
      });
    }
  },
  getAppLogs: function (appId) {
    this.unblock();
    var app = Apps.findOne(appId);
    if (app) {
      getAppLogs(app, function (err) {
        if (err) { throw err; }
      });
    }
  },
  restartApp: function (appId) {
    this.unblock();
    var app = Apps.findOne(appId);
    if (app && app.docker) {
      Apps.update(app._id, {$set: {
        status: 'STARTING'
      }});
      restartApp(app, function (err) {
        if (err) { console.error(err); }
      });
    }
  },
  resolveWatchers: function () {
    return Meteor._wrapAsync(resolveWatchers)();
  }
});
