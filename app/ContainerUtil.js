var _ = require('underscore');

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
  ports: function (container, callback) {
    var res = {};
    boot2docker.ip(function (err, ip) {
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
      callback(err, res);
    });
  },
  volumes: function (container) {
    var res = {};
    if (container.Volumes) {
      res = container.Volumes;
      _.each(res, function (value, key) {
        if (value && value.indexOf("/mnt/sda1/var/lib/docker/vfs/dir/") > -1) {
          res[key] = null;
        }
      });
    }
    return res;
  },
};

module.exports = ContainerUtil;
