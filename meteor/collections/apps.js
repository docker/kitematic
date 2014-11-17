Apps = new Meteor.Collection('apps');

Apps.COMMON_WEB_PORTS = [
  80,
  8000,
  8080,
  3000,
  5000,
  2368,
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
    if (this.docker && this.docker.Image) {
      return Images.findOne({'docker.Id': this.docker.Image});
    } else {
      return Images.findOne(this.imageId);
    }
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
    return 'http://localhost:80'; // CHANGE ME
  }
});
