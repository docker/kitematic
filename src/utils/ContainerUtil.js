var _ = require('underscore');
var docker = require('../utils/DockerUtil');

var ContainerUtil = {
  env: function (container) {
    if (!container || !container.Config || !container.Config.Env) {
      return {};
    }
    return _.object(container.Config.Env.map(function (env) {
      var i = env.indexOf('=');
      var splits = [env.slice(0, i), env.slice(i + 1)];
      return splits;
    }));
  },

  // TODO: inject host here instead of requiring Docker
  ports: function (container) {
    if (!container || !container.NetworkSettings) {
      return {};
    }
    var res = {};
    var ip = docker.host;
    _.each(container.NetworkSettings.Ports, function (value, key) {
      var dockerPort = key.split('/')[0];
      var localUrl = null;
      var localUrlDisplay = null;
      if (value && value.length) {
        var port = value[0].HostPort;
        localUrl = 'http://' + ip + ':' + port;
        localUrlDisplay = ip + ':' + port;
      }
      res[dockerPort] = {
        url: localUrl,
        display: localUrlDisplay
      };
    });
    return res;
  }
};

module.exports = ContainerUtil;
