Apps = new Meteor.Collection('apps');

Apps.COMMON_WEB_PORTS = [
  80,
  8000,
  8080,
  3000,
  5000,
  2368,
  1337
];

Apps.allow({
  'update': function () {
    return true;
  },
  'insert': function () {
    return true;
  },
  'remove': function () {
    return true;
  }
});

Apps.helpers({
  image: function () {
    return Images.findOne(this.imageId);
  },
  hostUrl: function () {
    return this.name + '.kite';
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
      return 'http://' + app.name + '.kite:' + image.meta.app.webPort;
    } else if (image && image.meta.app && image.meta.app.webPort === false) {
      return null;
    } else {
      // Picks the best port
      if (app.docker && app.docker.NetworkSettings.Ports) {
        var keys = _.keys(app.docker.NetworkSettings.Ports);
        var pickedPort = null;
        _.each(keys, function (key) {
          var port = parseInt(key.split('/')[0], 10);
          if (_.contains(Apps.COMMON_WEB_PORTS, port) && port !== 22) {
            pickedPort = port;
          }
        });
        if (pickedPort) {
          return 'http://' + app.name + '.kite:' + pickedPort;
        } else {
          if (keys.length > 0) {
            // Picks the first port that's not SSH
            for (var i = 0; i < keys.length; i++) {
              var port = parseInt(keys[i].split('/')[0], 10);
              if (port !== 22) {
                return 'http://' + app.name + '.kite:' + port;
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
