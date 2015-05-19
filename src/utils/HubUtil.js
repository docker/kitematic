var request = require('request');
var accountServerActions = require('../actions/AccountServerActions');

module.exports = {
  // Returns the base64 encoded index token or null if no token exists
  config: function () {
    let config = localStorage.getItem('auth.config');
    if (!config) {
      return null;
    }
    return config;
  },

  // Retrives the current jwt hub token or null if no token exists
  jwt: function () {
    let jwt = localStorage.getItem('auth.jwt');
    if (!jwt) {
      return null;
    }
    return jwt;
  },

  loggedin: function () {
    return this.jwt() && this.config();
  },

  // Places a token under ~/.dockercfg and saves a jwt to localstore
  login: function (username, password) {
    request.post('https://hub.docker.com/v2/users/login/', {form: {username, password}}, (err, response, body) => {
      let data = JSON.parse(body);
      if (response.statusCode === 200) {
        // TODO: save username to localstorage
        if (data.token) {
          localStorage.setItem('auth.jwt', data.token);
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
        accountServerActions.signedup({username});
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
