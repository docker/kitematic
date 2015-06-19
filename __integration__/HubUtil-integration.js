jest.autoMockOff();

jasmine.getEnv().defaultTimeoutInterval = 60000;

let hubUtil = require('../src/utils/HubUtil');
let Promise = require('bluebird');

describe('HubUtil Integration Tests', () => {
   describe('auth', () => {
    pit('successfully authenticates', () => {
      return new Promise((resolve) => {
        hubUtil.auth(process.env.INTEGRATION_USER, process.env.INTEGRATION_PASSWORD, (error, response, body) => {
          expect(response.statusCode).toBe(200);
          expect(error).toBe(null);

          let data = JSON.parse(body);
          expect(data.token).toBeTruthy();
          resolve();
        });
      });
    });

    pit('provides a 401 if credentials are incorrect', () => {
      return new Promise((resolve) => {
        hubUtil.auth(process.env.INTEGRATION_USER, 'incorrectpassword', (error, response) => {
          expect(response.statusCode).toBe(401);
          resolve();
        });
      });
    });
  });
});
