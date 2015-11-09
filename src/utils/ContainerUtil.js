import _ from 'underscore';
import docker from '../utils/DockerUtil';

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

  // Get existing links
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

  // Provide Foreground options
  mode: function (container) {
    if (!container || !container.Config) {
      return [true, true];
    }
    return [container.Config.Tty, container.Config.OpenStdin];
  },

  // TODO: inject host here instead of requiring Docker
  ports: function (container) {
    if (!container || !container.NetworkSettings) {
      return {};
    }
    var res = {};
    var ip = docker.host;
    var ports = (container.NetworkSettings.Ports) ? container.NetworkSettings.Ports : (container.HostConfig.PortBindings) ? container.HostConfig.PortBindings : container.Config.ExposedPorts;
    _.each(ports, function (value, key) {
      var dockerPort = key.split('/')[0];
      var localUrl = null;
      var localUrlDisplay = null;
      var port = null;
      if (value && value.length) {
        var port = value[0].HostPort;
        localUrl = 'http://' + ip + ':' + port;
      }
      res[dockerPort] = {
        url: localUrl,
        ip: ip,
        port: port
      };
    });
    return res;
  }
};

module.exports = ContainerUtil;
