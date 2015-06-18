var _ = require('underscore');
var request = require('request');
var async = require('async');
var util = require('../utils/Util');
var hubUtil = require('../utils/HubUtil');
var repositoryServerActions = require('../actions/RepositoryServerActions');
var tagServerActions = require('../actions/TagServerActions');
var Promise = require('bluebird');

let REGHUB2_ENDPOINT = process.env.REGHUB2_ENDPOINT || 'https://registry.hub.docker.com/v2';
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
        repositoryServerActions.error({error});
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
        repositoryServerActions.error({error});
      }

      let data = JSON.parse(body);
      let repos = data.repos;
      async.map(repos, (repo, cb) => {
        let name = repo.repo;
        if (util.isOfficialRepo(name)) {
          name = 'library/' + name;
        }

        request.get({
          url: `${REGHUB2_ENDPOINT}/repositories/${name}`,
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
          } else {
            repositoryServerActions.error({error: new Error('Could not fetch repository information from Docker Hub.')});
            return;
          }

        });
      }, (error, repos) => {
        repositoryServerActions.recommendedUpdated({repos});
      });
    });
  },

  tags: function (repo, callback) {
    hubUtil.request({
      url: `${REGHUB2_ENDPOINT}/repositories/${repo}/tags`
    }, (error, response, body) => {
      if (response.statusCode === 200) {
        let data = JSON.parse(body);
        tagServerActions.tagsUpdated({repo, tags: data.tags});
        if (callback) { callback(null, data.tags); }
      } else if (error || response.statusCode === 401) {
        repositoryServerActions.error({repo});
        if (callback) { callback(new Error('Failed to fetch repos')); }
      }
    });
  },

  // Returns the base64 encoded index token or null if no token exists
  repos: function (callback) {
    repositoryServerActions.reposLoading({repos: []});

    hubUtil.request({
      url: `${REGHUB2_ENDPOINT}/namespaces/`,
    }, (error, response, body) => {
      if (error) {
        repositoryServerActions.error({error});
        if (callback) { callback(error); }
        return;
      }

      if (response.statusCode !== 200) {
        let generalError = new Error('Failed to fetch repos');
        repositoryServerActions.error({error: generalError});
        if (callback) { callback({error: generalError}); }
        return;
      }

      let data = JSON.parse(body);
      let namespaces = data.namespaces;
      async.map(namespaces, (namespace, cb) => {
        hubUtil.request({
          url: `${REGHUB2_ENDPOINT}/repositories/${namespace}`
        }, (error, response, body) => {
            if (error) {
              repositoryServerActions.error({error});
              if (callback) { callback(error); }
              return;
            }

            if (response.statusCode !== 200) {
              repositoryServerActions.error({error: new Error('Could not fetch repository information from Docker Hub.')});
              return;
            }

            let data = JSON.parse(body);
            cb(null, data.results);
          });
        }, (error, lists) => {
          if (error) {
            repositoryServerActions.error({error});
            if (callback) { callback(error); }
            return;
          }

          let repos = [];
          for (let list of lists) {
            repos = repos.concat(list);
          }

          _.each(repos, repo => {
            repo.is_user_repo = true;
          });

          repositoryServerActions.reposUpdated({repos});
          if (callback) { callback(null, repos); }
      });
    });
  }
};
