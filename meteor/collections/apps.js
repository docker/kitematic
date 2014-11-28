Apps = new Meteor.Collection('apps');

Apps.COMMON_WEB_PORTS = [
  '80',
  '8000',
  '8080',
  '3000',
  '5000',
  '2368',
  '443'
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
    if (!app.docker || !app.docker.NetworkSettings.Ports) {
      return [];
    }

    var results = _.map(app.docker.NetworkSettings.Ports, function (value, key) {
      var portProtocolPair = key.split('/');
      var res = {
        'port': portProtocolPair[0],
        'protocol': portProtocolPair[1]
      };
      if (value && value.length) {
        var port = value[0].HostPort;
        res['hostIp'] = Docker.hostIp;
        res['hostPort'] = port;
        res['web'] = Apps.COMMON_WEB_PORTS.indexOf(res.port) !== -1;
        res['url'] = 'http://' + Docker.hostIp + ':' + port;
      } else {
        return null;
      }
      return res;
    });

    results = _.filter(results, function (res) { return res !== null; });

    results.sort(function (a, b) {
      // prefer lower ports
      if (a.web && b.web) {
        return b.port - a.port;
      }

      if (a.web) {
        return -1;
      } else {
        return 1;
      }
    });
    return results;
  }
});
