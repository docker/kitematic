Apps = new Meteor.Collection('apps');

schemaApps = new SimpleSchema({
  imageId: {
    type: Meteor.ObjectID,
    label: "ID of the image used by the app",
    max: 200
  },
  docker: {
    type: Object,
    label: "Docker container data",
    blackbox: true,
    optional: true
  },
  status: {
    type: String,
    allowedValues: ['STARTING', 'READY', 'ERROR'],
    label: "App current status",
    max: 200
  },
  config: {
    type: Object,
    label: "App environment variables",
    blackbox: true
  },
  name: {
    type: String,
    label: "App name",
    max: 200
  },
  logs: {
    type: [String],
    label: "Logs",
    defaultValue: []
  },
  path: {
    type: String,
    label: "Path to the app directory",
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      var now = new Date();
      if (this.isInsert) {
        return now;
      } else if (this.isUpsert) {
        return {$setOnInsert: now};
      } else {
        this.unset();
      }
    },
    denyUpdate: true,
    label: "Time of app created"
  }
});

Apps.helpers({
  image: function () {
    return Images.findOne(this.imageId);
  },
  hostUrl: function () {
    return this.name + '.dev';
  },
  ports: function () {
    var app = this;
    if (app.docker && app.docker.NetworkSettings.Ports) {
      var ports = _.map(_.keys(app.docker.NetworkSettings.Ports), function (portObj) {
        var port = parseInt(portObj.split('/')[0], 10);
        return port;
      });
      return ports.join(', ');
    } else {
      return null;
    }
  },
  url: function () {
    var app = this;
    var image = Images.findOne(app.imageId);
    if (image && image.meta.app && image.meta.app.webPort) {
      return 'http://' + app.name + '.dev:' + image.meta.app.webPort;
    } else if (image && image.meta.app && image.meta.app.webPort === false) {
      return null;
    } else {
      // Picks the best port
      if (app.docker && app.docker.NetworkSettings.Ports) {
        var keys = _.keys(app.docker.NetworkSettings.Ports);
        var pickedPort = null;
        _.each(keys, function (key) {
          var port = parseInt(key.split('/')[0], 10);
          if (_.contains(COMMON_WEB_PORTS, port) && port !== 22) {
            pickedPort = port;
          }
        });
        if (pickedPort) {
          return 'http://' + app.name + '.dev:' + pickedPort;
        } else {
          if (keys.length > 0) {
            // Picks the first port that's not SSH
            for (var i = 0; i < keys.length; i++) {
              var port = parseInt(keys[i].split('/')[0], 10);
              if (port !== 22) {
                return 'http://' + app.name + '.dev:' + port;
              }
            }
            return null;
          } else {
            return null;
          }
        }
      } else {
        return null;
      }
    }
  }
});

Apps.attachSchema(schemaApps);

Apps.after.insert(function (userId, app) {
  // Give app an unique environment variable
  var appId = this._id;
  Apps.update(appId, {
    $set: {
      'config.APP_ID': appId
    }
  });
  var image = Images.findOne(app.imageId);
  Util.copyVolumes(image.path, app.name);
  app = Apps.findOne(appId);
  Docker.removeBindFolder(app.name, function (err) {
    if (err) {
      console.error(err);
    }
    Fiber(function () {
      Meteor.call('runApp', app, function (err) {
        if (err) { throw err; }
      });
    }).run();
  });
});

Apps.after.remove(function (userId, app) {
  if (app.docker) {
    try {
      Docker.removeContainerSync(app.docker.Id);
    } catch (e) {
      console.error(e);
    }
  }
  var appPath = path.join(KITE_PATH, app.name);
  Util.deleteFolder(appPath);
  Docker.removeBindFolder(app.name, function () {
    console.log('Deleted Kite ' + app.name + ' directory.');
  });
});
