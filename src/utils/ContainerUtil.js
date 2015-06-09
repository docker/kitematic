var _ = require('underscore');
var docker = require('../utils/DockerUtil');

var ContainerUtil = {
  env: function (container) {
    if (!container || !container.Config || !container.Config.Env) {
      return [];
    }
    return _.map(container.Config.Env, env => {
      var i = env.indexOf('=');
      var splits = [env.slice(0, i), env.slice(i + 1)];
      return splits;
    });
  },

  links: function (container) {
    if (!container || !container.HostConfig || !container.HostConfig.Links) {
      return [];
    }
    return _.map(container.HostConfig.Links, link => {
      var i = link.indexOf(':');
      // Account for the slashes
      if (link.indexOf('/') != -1 && link.indexOf('/') < i) {
        var keyStart = link.indexOf('/') + 1;
      } else {
        var keyStart = 0;
      }
      if (link.lastIndexOf('/') != -1 && link.lastIndexOf('/') > i) {
        var valStart = link.lastIndexOf('/') + 1;
      } else {
        var valStart = i + 1;
      }
      var splits = [link.slice(keyStart, i), link.slice(valStart)];
      return splits;
    });
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
