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
  },

  /**
   * Check if there is port colision with other containers
   * @param  {String} name       name of the current container
   * @param  {Array}  containers array of all containers
   * @param  {String} port
   * @return {Object|null}       return nothing or container with colision
   */
  isPortCollision: function(name, containers, port) {
    var interfaces = {};
    _.forEach(containers, container => {
      if (container.Name != name) {
        _.forEach(this.ports(container), ({ip, port}) => {
          interfaces[ip + ':' + port] = container;
        });
      }
    });
    return interfaces[docker.host + ':' + port];
  }
};

module.exports = ContainerUtil;
