var util = require('./Util');
var parseUri = require('parseUri');
var containerServerActions = require('../actions/ContainerServerActions');

module.exports = {
  TYPE_WHITELIST: ['repository'],
  METHOD_WHITELIST: ['run'],
  openUrl: function (url, flags, appVersion) {
    if (!url || !flags || !flags.dockerURLEnabledVersion || !appVersion) {
      return false;
    }

    // Make sure this feature is enabled via the feature flag
    if (util.compareVersions(appVersion, flags.dockerURLEnabledVersion) < 0) {
      return false;
    }

    var parser = parseUri(url);

    if (parser.protocol !== 'docker') {
      return false;
    }

    // Get the type of object we're operating on, e.g. 'repository'
    var type = parser.host;

    if (this.TYPE_WHITELIST.indexOf(type) === -1) {
      return false;
    }

    // Separate the path into [run', 'redis']
    var tokens = parser.path.replace('/', '').split('/');

    // Get the method trying to be executed, e.g. 'run'
    var method = tokens[0];

    if (this.METHOD_WHITELIST.indexOf(method) === -1) {
      return false;
    }

    // Get the repository namespace and repo name, e.g. 'redis' or 'myusername/myrepo'
    var repo = tokens.slice(1).join('/');

    // Only accept official repos for now (one component)
    if (tokens > 1) {
      return false;
    }

    // Only accept official repos for now
    if (!util.isOfficialRepo(repo)) {
      return false;
    }

    if (type === 'repository' && method === 'run') {
      containerServerActions.pending({repo, tag: 'latest'});
      return true;
    }
    return false;
  }
};
