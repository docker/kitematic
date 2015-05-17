var request = require('request');
var async = require('async');
var repositoryServerActions = require('../actions/RepositoryServerActions');

module.exports = {
  // Returns the base64 encoded index token or null if no token exists
  repos: function (jwt) {

    // TODO: provide jwt
    request.get({
      url: 'https://registry.hub.docker.com/v2/namespaces/',
      headers: {
        Authorization: `JWT ${jwt}`
      }
    }, (error, response, body) => {
      if (error) {
        repositoryServerActions.error({error});
      }

      let data = JSON.parse(body);
      let namespaces = data.namespaces;
      async.map(namespaces, (namespace, cb) => {
        request.get({
          url: `https://registry.hub.docker.com/v2/repositories/${namespace}`,
          headers: {
            Authorization: `JWT ${jwt}`
          }
        }, (error, response, body) => {
            if (error) {
              repositoryServerActions.error({error});
            }

            let data = JSON.parse(body);
            cb(null, data.results);
          });
        }, (error, lists) => {
          let repos = [];
          for (let list of lists) {
            repos = repos.concat(list);
          }
          repositoryServerActions.fetched({repos});
      });
    });
  }
};
