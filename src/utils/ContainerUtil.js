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

  // Provide Foreground options
  mode: function (container) {
    return [
        (container && container.Config) ? container.Config.Tty : true,
        (container && container.Config) ? container.Config.OpenStdin : true,
        (container && container.HostConfig) ? container.HostConfig.Privileged : false
    ];
  },

  // TODO: inject host here instead of requiring Docker
  ports: function (container) {
    if (!container || !container.NetworkSettings) {
      return {};
    }
    var res = {};
    var ip = docker.host;
    var ports = (container.NetworkSettings.Ports) ? container.NetworkSettings.Ports : ((container.HostConfig.PortBindings) ? container.HostConfig.PortBindings : container.Config.ExposedPorts);
    _.each(ports, function (value, key) {
      var [dockerPort, portType] = key.split('/');
      var localUrl = null;
      var port = null;
      if (value && value.length) {
        port = value[0].HostPort;
      }
      localUrl = (port) ? ip + ':' + port : ip + ':' + '<not set>';

      res[dockerPort] = {
        url: localUrl,
        ip: ip,
        port: port,
        portType: portType
      };
    });
    return res;
  },

  links: function (container) {
    if (!container || !container.HostConfig || !container.HostConfig.Links) {
      return [];
    }

    var res = _.map(container.HostConfig.Links, (link, key) => {
        return {
            "container": link.split(":")[0].split("/")[1],
            "alias": link.split(":")[1].split("/")[2],
        }
    });

    return res;
  },

  normalizeLinksPath: function (container, links) {
    var res = _.map(links, (link) => {
      return "/"+link.container+":/"+container.Name+"/"+link.alias;
    });

    return res;
  }

};

module.exports = ContainerUtil;
