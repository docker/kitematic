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
