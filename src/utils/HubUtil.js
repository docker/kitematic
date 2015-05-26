var request = require('request');
var accountServerActions = require('../actions/AccountServerActions');
var regHubUtil = require('./RegHubUtil');

module.exports = {
  init: function () {
    accountServerActions.prompted({prompted: localStorage.getItem('auth.prompted')});
    let username = localStorage.getItem('auth.username');
    let verified = localStorage.getItem('auth.verified') === 'true';
    if (username) { // TODO: check for config too
      accountServerActions.loggedin({username, verified});
    }
  },

  // Returns the base64 encoded index token or null if no token exists
  config: function () {
    let config = localStorage.getItem('auth.config');
    if (!config) {
      return null;
    }
    return config;
  },

  isPrompted: function () {
    return localStorage.getItem('auth.prompted');
  },

  prompted: function (prompted) {
    localStorage.setItem('auth.prompted', true);
    accountServerActions.prompted({prompted});
  },

  // Retrives the current jwt hub token or null if no token exists
  jwt: function () {
    let jwt = localStorage.getItem('auth.jwt');
    if (!jwt) {
      return null;
    }
    return jwt;
  },

  post: function (req) {

  },

  get: function (req) {
    // TODO: implement me and wrap all jwt calls
  },

  loggedin: function () {
    return this.jwt() && this.config();
  },

  logout: function () {
    accountServerActions.loggedout();
    localStorage.removeItem('auth.jwt');
    localStorage.removeItem('auth.username');
    localStorage.removeItem('auth.verified');
    localStorage.removeItem('auth.config');
  },

  // Places a token under ~/.dockercfg and saves a jwt to localstore
  login: function (username, password) {
    request.post('https://hub.docker.com/v2/users/login/', {form: {username, password}}, (err, response, body) => {
      let data = JSON.parse(body);
      if (response.statusCode === 200) {
        if (data.token) {
          localStorage.setItem('auth.jwt', data.token);
          localStorage.setItem('auth.username', username);
          localStorage.setItem('auth.verified', true);
          localStorage.setItem('auth.config', new Buffer(username + ':' + password).toString('base64'));
          accountServerActions.loggedin({username, verified: true});
          regHubUtil.repos(data.token);
        } else {
          accountServerActions.errors({errors: {details: new Error('Did not receive login token.')}});
        }
      } else if (response.statusCode === 401) {
        if (data && data.detail && data.detail.indexOf('Account not active yet') !== -1) {
          accountServerActions.loggedin({username, verified: false});
          localStorage.setItem('auth.username', username);
          localStorage.setItem('auth.verified', false);
          localStorage.setItem('auth.config', new Buffer(username + ':' + password).toString('base64'));
        } else {
          accountServerActions.errors({errors: data});
        }
      }


    });
  },

  verify: function () {
    let config = this.config();
    if (!config) {
      this.logout();
      return;
    }

    let [username, password] = new Buffer(config, 'base64').toString().split(/:(.+)?/).slice(0, 2);
    this.login(username, password);
  },

  // Signs up and places a token under ~/.dockercfg and saves a jwt to localstore
  signup: function (username, password, email, subscribe) {
    request.post('https://hub.docker.com/v2/users/signup/', {
      form: {
        username,
        password,
        email,
        subscribe
      }
    }, (err, response, body) => {
      // TODO: save username to localstorage
      if (response.statusCode === 204) {
        accountServerActions.signedup({username, verified: false});
        localStorage.setItem('auth.username', username);
        localStorage.setItem('auth.verified', false);
        localStorage.setItem('auth.config', new Buffer(username + ':' + password).toString('base64'));
      } else {
        let data = JSON.parse(body);
        let errors = {};
        for (let key in data) {
          errors[key] = data[key][0];
        }
        accountServerActions.errors({errors});
      }
    });
  },
};
