var _ = require('underscore');
var request = require('request');
var async = require('async');
var util = require('../utils/Util');
var hubUtil = require('../utils/HubUtil');
var repositoryServerActions = require('../actions/RepositoryServerActions');
var tagServerActions = require('../actions/TagServerActions');

let searchReq = null;

module.exports = {
  // Normalizes results from search to v2 repository results
  normalize: function (repo) {
    let obj = _.clone(repo);
    if (obj.is_official) {
      obj.namespace = 'library';
    } else {
      let [namespace, name] = repo.name.split('/');
      obj.namespace = namespace;
      obj.name = name;
    }

    return obj;
  },

  search: function (query, page) {
    if (searchReq) {
      searchReq.abort();
      searchReq = null;
    }

    if (!query) {
      repositoryServerActions.resultsUpdated({repos: []});
    }

    searchReq = request.get({
      url: 'https://registry.hub.docker.com/v1/search?',
      qs: {q: query, page}
    }, (error, response, body) => {
      if (error) {
        repositoryServerActions.searchError({error});
      }

      let data = JSON.parse(body);
      let repos = _.map(data.results, result => {
        return this.normalize(result);
      });
      if (response.statusCode === 200) {
        repositoryServerActions.resultsUpdated({repos});
      }
    });
  },

  recommended: function () {
    request.get('https://kitematic.com/recommended.json', (error, response, body) => {
      if (error) {
        repositoryServerActions.recommendedError({error});
      }

      let data = JSON.parse(body);
      let repos = data.repos;
      async.map(repos, (repo, cb) => {
        let name = repo.repo;
        if (util.isOfficialRepo(name)) {
          name = 'library/' + name;
        }

        request.get({
          url: `https://registry.hub.docker.com/v2/repositories/${name}`,
        }, (error, response, body) => {
          if (error) {
            repositoryServerActions.error({error});
            return;
          }

          if (response.statusCode === 200) {
            let data = JSON.parse(body);
            data.is_recommended = true;
            _.extend(data, repo);
            cb(null, data);
          }
        });
      }, (error, repos) => {
        repositoryServerActions.recommendedUpdated({repos});
      });
    });
  },

  tags: function (repo) {
    hubUtil.request({
      url: `https://registry.hub.docker.com/v2/repositories/${repo}/tags`
    }, (error, response, body) => {
      if (response.statusCode === 200) {
        let data = JSON.parse(body);
        tagServerActions.tagsUpdated({repo, tags: data.tags});
      } else if (response.statusCude === 401) {
        return;
      }
    });
  },

  // Returns the base64 encoded index token or null if no token exists
  repos: function () {
    repositoryServerActions.reposLoading({repos: []});

    hubUtil.request({
      url: 'https://registry.hub.docker.com/v2/namespaces/',
    }, (error, response, body) => {
      if (error) {
        repositoryServerActions.reposError({error});
        return;
      }

      let data = JSON.parse(body);
      let namespaces = data.namespaces;
      async.map(namespaces, (namespace, cb) => {
        hubUtil.request({
          url: `https://registry.hub.docker.com/v2/repositories/${namespace}`
        }, (error, response, body) => {
            if (error) {
              repositoryServerActions.reposError({error});
              return;
            }

            let data = JSON.parse(body);
            cb(null, data.results);
          });
        }, (error, lists) => {
          let repos = [];
          for (let list of lists) {
            repos = repos.concat(list);
          }

          _.each(repos, repo => {
            repo.is_user_repo = true;
          });

          repositoryServerActions.reposUpdated({repos});
      });
    });
  }
};
