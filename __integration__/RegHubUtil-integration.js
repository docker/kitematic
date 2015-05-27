// One minute timeout for integration tests
jasmine.getEnv().DEFAULT_TIMEOUT_INTERVAL = 60000;

let _ = require('underscore');
let regHubUtil = require('../src/utils/RegHubUtil');
let hubUtil = require('../src/utils/HubUtil');
let Promise = require('bluebird');

describe('RegHubUtil Integration Tests', () => {
  describe('with login', () => {
    pit('lists private repos', () => {
      return new Promise((resolve) => {
        hubUtil.login(process.env.INTEGRATION_USER, process.env.INTEGRATION_PASSWORD, () => {
          regHubUtil.repos((error, repos) => {
            expect(_.findWhere(repos, {name: 'test_private', is_private: true})).toBeTruthy();
            resolve();
          });
        });
      });
    });

    pit('lists tags for a private repo', () => {
      return new Promise((resolve) => {
        hubUtil.login(process.env.INTEGRATION_USER, process.env.INTEGRATION_PASSWORD, () => {
          regHubUtil.tags(`${process.env.INTEGRATION_USER}/test_private`, (error, tags) => {
            expect(error).toBeFalsy();
            expect(tags).toEqual(['latest']);
            resolve();
          });
        });
      });
    });
  });

  describe('public repos', () => {
    pit('lists repos', () => {
      return new Promise((resolve) => {
        hubUtil.login(process.env.INTEGRATION_USER, process.env.INTEGRATION_PASSWORD, () => {
          regHubUtil.repos((error, repos) => {
            expect(_.findWhere(repos, {name: 'test'})).toBeTruthy();
            resolve();
          });
        });
      });
    });

    pit('lists tags for a repo', () => {
      return new Promise((resolve) => {
        hubUtil.login(process.env.INTEGRATION_USER, process.env.INTEGRATION_PASSWORD, () => {
          regHubUtil.tags(`${process.env.INTEGRATION_USER}/test`, (error, tags) => {
            expect(error).toBeFalsy();
            expect(tags).toEqual(['latest']);
            resolve();
          });
        });
      });
    });
  });
});
