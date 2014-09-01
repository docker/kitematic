Apps.restart = function (app, callback) {
  if (app.docker && app.docker.Id) {
    try {
      Docker.restartContainerSync(app.docker.Id);
    } catch (e) {
      console.error(e);
    }
    var containerData = Docker.getContainerDataSync(app.docker.Id);
    Fiber(function () {
      Apps.update(app._id, {$set: {
        status: 'READY',
        docker: containerData
      }});
    }).run();
    callback(null);
    // Use dig to refresh the DNS
    exec('/usr/bin/dig dig ' + app.name + '.dev @172.17.42.1 ', function() {});
  } else {
    callback(null);
  }
};

Apps.logs = function (app) {
  if (app.docker && app.docker.Id) {
    var container = docker.getContainer(app.docker.Id);
    container.logs({follow: false, stdout: true, stderr: true, timestamps: true, tail: 300}, function (err, response) {
      if (err) { throw err; }
      Fiber(function () {
        Apps.update(app._id, {
          $set: {
            logs: []
          }
        });
      }).run();
      var logs = [];
      response.setEncoding('utf8');
      response.on('data', function (line) {
        logs.push(convert.toHtml(line.slice(8)));
        Fiber(function () {
          Apps.update(app._id, {
            $set: {
              logs: logs
            }
          });
        }).run();
      });
      response.on('end', function () {});
    });
  }
};

Apps.recover = function (callback) {
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
          Apps.restart(app, function (err) {
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
    this.unblock();
    return Meteor._wrapAsync(Apps.recover)();
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
    Apps.remove({_id: app._id});
  },
  createApp: function (formData) {
    this.unblock();
    var validationResult = formValidate(formData, FormSchema.formCreateApp);
    if (validationResult.errors) {
      throw new Meteor.Error(400, 'Validation Failed.', validationResult.errors);
    } else {
      var cleaned = validationResult.cleaned;
      var appName = cleaned.name;
      var appPath = path.join(KITE_PATH, appName);
      if (!fs.existsSync(appPath)) {
        console.log('Created Kite ' + appName + ' directory.');
        fs.mkdirSync(appPath, function (err) {
          if (err) { throw err; }
        });
      }
      var appObj = {
        name: appName,
        imageId: cleaned.imageId,
        status: 'STARTING',
        config: {},
        path: appPath
      };
      Apps.insert(appObj);
    }
  },
  getAppLogs: function (appId) {
    this.unblock();
    var app = Apps.findOne(appId);
    if (app) {
      Apps.logs(app, function (err) {
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
      Apps.restart(app, function (err) {
        if (err) { console.error(err); }
      });
    }
  },
  resolveWatchers: function () {
    this.unblock();
    return Meteor._wrapAsync(resolveWatchers)();
  }
});
