var request = require('request');
var accountServerActions = require('../actions/AccountServerActions');

module.exports = {

  init: function () {
    accountServerActions.prompted({prompted: localStorage.getItem('auth.prompted')});
    if (this.jwt()) { // TODO: check for config too
      let username = localStorage.getItem('auth.username');
      let verified = localStorage.getItem('auth.verified');
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

  refresh: function () {
    // TODO: implement me
  },

  logout: function () {
    localStorage.removeItem('auth.jwt');
    localStorage.removeItem('auth.username');
    localStorage.removeItem('auth.verified');
    localStorage.removeItem('auth.config');
    accountServerActions.loggedout();
  },

  // Places a token under ~/.dockercfg and saves a jwt to localstore
  login: function (username, password) {
    request.post('https://hub.docker.com/v2/users/login/', {form: {username, password}}, (err, response, body) => {
      let data = JSON.parse(body);
      if (response.statusCode === 200) {
        // TODO: save username to localstorage
        // TODO: handle case where token does not exist
        if (data.token) {
          localStorage.setItem('auth.jwt', data.token);
          localStorage.setItem('auth.username', username);
        }
        accountServerActions.loggedin({username, verified: true});
      } else if (response.statusCode === 401) {
        if (data && data.detail && data.detail.indexOf('Account not active yet') !== -1) {
          accountServerActions.loggedin({username, verified: false});
        } else {
          accountServerActions.errors({errors: data});
        }
      }
    });
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
