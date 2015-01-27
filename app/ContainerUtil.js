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
  }
};

module.exports = ContainerUtil;
