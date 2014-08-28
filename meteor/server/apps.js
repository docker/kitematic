var watchers = {};

removeBindFolder = function (name, callback) {
  exec(path.join(getBinDir(), 'boot2docker') + ' ssh "sudo rm -rf /var/lib/docker/binds/' + name + '"', function(err, stdout) {
    callback(err, stdout);
  });
};

removeAppWatcher = function (id) {
  if (watchers[id]) {
    watchers[id].watcher.close();
    delete watchers[id];
  }
};

addAppWatcher = function (app) {
  removeAppWatcher(app._id);
  var appPath = path.join(KITE_PATH, app.name);
  var vmDir = path.join('/var/lib/docker/binds', app.name);
  var vmPath = 'ssh://docker@localhost:2022/' + vmDir;
  var watcher = chokidar.watch(appPath, {ignored: /[\/\\]\./});

  var syncFunc = function () {
    // Make sure that if they delete the app_name folder under ~/Kitematic, we don't delete all the volumes.
    // Deleting files inside the app_name folder _will_ delete the volumes.
    var rootMissing = '';
    if (!fs.existsSync(appPath)) {
      rootMissing = '-ignorearchives';
      console.log('Created Kite ' + app.name + ' directory.');
      fs.mkdirSync(appPath, function (err) {
        if (err) { throw err; }
      });
    }

    var errorPattern = /The\sfile\s(.*)\son\shost/g;
    var archiveErrorPattern = /Archive\s(.*)\son\shost\s.*\sshould\sbe\sDELETED/g;
    var command = path.join(getBinDir(), 'unison') + ' ' + vmPath + ' ' + appPath + ' -prefer ' + vmPath + ' ' + rootMissing + ' -servercmd "sudo unison" -batch -log=false -confirmbigdel=false -ignore "Name {*.tmp,*.unison,*.swp,*.pyc,.DS_STORE}" -auto -sshargs "-o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -i ' + path.join(getHomePath(), '.ssh/id_boot2docker') + '"';
    exec(command, function (err) {
      if (err) {
        var results;
        var location;
        console.error(err);
        try {
          if (err.message.indexOf('the archives are locked.') !== -1) {
            results = errorPattern.exec(err.message);
            location = results[1].replace(' ', '\\ ');
            exec('/bin/rm -rf ' + location, function () {
              console.log('Removed unison file.');
              console.log(location);
            });
          }
          if (err.message.indexOf('The archive file is missing on some hosts') !== -1) {
            results = archiveErrorPattern.exec(err.message);
            location = results[1].replace(' ', '\\ ');
            var fullLocation = path.join(getHomePath(), 'Library/Application\\ Support/Unison', location);
            var cmd = '/bin/rm -rf ' + fullLocation;
            exec(cmd, function () {});
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  watchers[app._id] = {
    watcher: watcher,
    sync: syncFunc
  };
  watcher.on('all', syncFunc);
};

resolveWatchers = function (callback) {
  var apps = Apps.find({}).fetch();
  var ids = _.map(apps, function(app) {
    return app._id;
  });
  var watcherKeys = _.keys(watchers);
  var toAdd = _.difference(ids, watcherKeys);
  var toRemove = _.difference(watcherKeys, ids);

  _.each(toAdd, function (id) {
    addAppWatcher(Apps.findOne(id), function () {});
  });

  _.each(toRemove, function (id) {
    removeAppWatcher(id);
  });

  // Run a sync for 'pulling' changes in the volumes.
  _.each(watchers, function (watcher) {
    watcher.sync();
  });

  callback();
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
      removeAppWatcher(app._id);
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
