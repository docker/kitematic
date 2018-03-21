import async from "async";
import * as os from "os";
import request from "request";
import _ from "underscore";
import repositoryServerActions from "../actions/RepositoryServerActions";
import tagServerActions from "../actions/TagServerActions";
import hubUtil from "../utils/HubUtil";
import util from "../utils/Util";
const cachedRequest = require("cached-request")(request);
const cacheDirectory = os.tmpdir() + "/cachekitematic";
cachedRequest.setCacheDirectory(cacheDirectory);
cachedRequest.setValue("ttl", 3000);

const REGHUB2_ENDPOINT = process.env.REGHUB2_ENDPOINT || "https://hub.docker.com/v2";
let searchReq = null;
const PAGING = 24;

export default {
  // Normalizes results from search to v2 repository results
  normalize(repo) {
    const obj = _.clone(repo);
    if (obj.is_official) {
      obj.namespace = "library";
    } else {
      const [namespace, name] = repo.name.split("/");
      obj.namespace = namespace;
      obj.name = name;
    }

    return obj;
  },

  search(query, page, sorting = null) {
    if (searchReq) {
      if (searchReq.request) {
        searchReq.request.abort();
      }
      searchReq = null;
    }

    if (!query) {
      repositoryServerActions.resultsUpdated({repos: []});
    }
    /**
     * Sort:
     * All - no sorting
     * ordering: -start_count
     * ordering: -pull_count
     * is_automated: 1
     * is_official: 1
     */

    searchReq = cachedRequest({
      url: `${REGHUB2_ENDPOINT}/search/repositories/?`,
      qs: {query, page, page_size: PAGING, sorting},
    }, (error, response, body) => {
      if (error) {
        repositoryServerActions.error({error});
      }

      const data = JSON.parse(body);
      const repos = _.map(data.results, (result) => {
        result.name = result.repo_name;
        return this.normalize(result);
      });
      const next = data.next;
      const previous = data.previous;
      const total = Math.floor(data.count / PAGING);
      if (response.statusCode === 200) {
        repositoryServerActions.resultsUpdated({repos, page, previous, next, total});
      }
    });
  },

  recommended() {
    cachedRequest({
      url: "https://kitematic.com/recommended.json",
    }, (error, response, body) => {
      if (error) {
        repositoryServerActions.error({error});
        return;
      }

      if (response.statusCode !== 200) {
        repositoryServerActions.error({error: new Error("Could not fetch recommended repo list. Please try again later.")});
        return;
      }

      const data = JSON.parse(body);
      const repos = data.repos;
      async.map(repos, (repo, cb) => {
        let name = repo.repo;
        if (util.isOfficialRepo(name)) {
          name = "library/" + name;
        }

        cachedRequest({
          url: `${REGHUB2_ENDPOINT}/repositories/${name}`,
        }, (error, response, body) => {
          if (error) {
            repositoryServerActions.error({error});
            return;
          }

          if (response.statusCode === 200) {
            const data = JSON.parse(body);
            data.is_recommended = true;
            _.extend(data, repo);
            cb(null, data);
          } else {
            repositoryServerActions.error({error: new Error("Could not fetch repository information from Docker Hub.")});
            return;
          }

        });
      }, (error, repos) => {
        repositoryServerActions.recommendedUpdated({repos});
      });
    });
  },

  tags(repo, callback) {
    hubUtil.request({
      url: `${REGHUB2_ENDPOINT}/repositories/${repo}/tags`,
      qs: {page: 1, page_size: 100},
    }, (error, response, body) => {
      if (response.statusCode === 200) {
        const data = JSON.parse(body);
        tagServerActions.tagsUpdated({repo, tags: data.results || []});
        if (callback) {
          return callback(null, data.results || []);
        }
      } else {
        repositoryServerActions.error({repo});
        if (callback) {
          return callback(new Error("Failed to fetch tags for repo"));
        }
      }
    });
  },

  // Returns the base64 encoded index token or null if no token exists
  repos(callback?) {
    repositoryServerActions.reposLoading({repos: []});
    const namespaces = [];
    // Get Orgs for user
    hubUtil.request({
      url: `${REGHUB2_ENDPOINT}/user/orgs/`,
      qs: { page_size: 1000 },
    }, (orgError, orgResponse, orgBody) => {
      if (orgError) {
        repositoryServerActions.error({orgError});
        if (callback) {
          return callback(orgError);
        }
        return null;
      }

      if (orgResponse.statusCode === 401) {
        hubUtil.logout();
        repositoryServerActions.reposUpdated({repos: []});
        return;
      }

      if (orgResponse.statusCode !== 200) {
        const generalError = new Error("Failed to fetch repos");
        repositoryServerActions.error({error: generalError});
        if (callback) {
          callback({error: generalError});
        }
        return null;
      }
      try {
        const orgs = JSON.parse(orgBody);
        orgs.results.map((org) => {
          namespaces.push(org.orgname);
        });
        // Add current user
        namespaces.push(hubUtil.username());
      } catch (jsonError) {
        repositoryServerActions.error({jsonError});
        if (callback) {
          return callback(jsonError);
        }
      }

      async.map(namespaces, (namespace, cb) => {
        hubUtil.request({
          url: `${REGHUB2_ENDPOINT}/repositories/${namespace}`,
          qs: { page_size: 1000 },
        }, (error, response, body) => {
          if (error) {
            repositoryServerActions.error({error});
            if (callback) {
              callback(error);
            }
            return null;
          }

          if (orgResponse.statusCode === 401) {
            hubUtil.logout();
            repositoryServerActions.reposUpdated({repos: []});
            return;
          }

          if (response.statusCode !== 200) {
            repositoryServerActions.error({error: new Error("Could not fetch repository information from Docker Hub.")});
            return null;
          }

          const data = JSON.parse(body);
          cb(null, data.results);
        });
      }, (error, lists) => {
        if (error) {
          repositoryServerActions.error({error});
          if (callback) {
            callback(error);
          }
          return null;
        }

        let repos = [];
        for (const list of lists) {
          repos = repos.concat(list);
        }

        _.each(repos, (repo) => {
          repo.is_user_repo = true;
        });

        repositoryServerActions.reposUpdated({repos});
        if (callback) {
          return callback(null, repos);
        }
        return null;
      });
    });
  },
};
