import util from './Util';
import parseUri from 'parseUri';
import containerActions from '../actions/ContainerActions';

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

    if (parser.protocol !== 'kitematic') {
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

    if (type === 'repository' && method === 'run') {
      let tag = 'latest';
      containerActions.pending({name, repo, tag});
      return true;
    }
    return false;
  }
};
