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
      if(link.indexOf('/') != -1 && link.indexOf('/') < i) {
        var keyStart = link.indexOf('/') + 1;
      } else {
        var keyStart = 0;
      }
      if(link.lastIndexOf('/') != -1 && link.lastIndexOf('/') > i) {
        var valStart = link.lastIndexOf('/') + 1;
      } else {
        var valStart = i + 1;
      }
      var splits = [link.slice(keyStart, i), link.slice(valStart)];
      return splits;
    });
  },

  runtime: function (container) {
    // Grab saved hostconfig if previous setup failed
    var SavedOpts = JSON.parse(localStorage.getItem('settings.runtime.' + container.Name));
    var SavedConfig = {}
    _.each(SavedOpts, function(val, key){
      if(key == "CpuShares" || key == "Memory" || key == "MemorySwap") {
        SavedConfig[key] = val;
      }
    });
    _.extend(SavedConfig, container.HostConfig);
    if (!container || !container.HostConfig ) {
      return [["CpuShares",""],["Memory",""],["MemorySwap",""]];
    }
    return _.map([
      ['CpuShares',container.HostConfig.CpuShares],
      ['Memory', container.HostConfig.Memory/1000000],
      ['MemorySwap', container.HostConfig.MemorySwap/1000000]
    ]);
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
