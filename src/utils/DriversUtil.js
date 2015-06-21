var assign = require('object-assign');
var Mixpanel = require('mixpanel');
var uuid = require('node-uuid');
var fs = require('fs');
var path = require('path');
var util = require('./Util');
var os = require('os');
var osxRelease = require('osx-release');
var settings;

try {
  settings = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'settings.json'), 'utf8'));
} catch (err) {
  settings = {};
}

var token = process.env.NODE_ENV === 'development' ? settings['mixpanel-dev'] : settings.mixpanel;
if (!token) {
  token = 'none';
}

var mixpanel = Mixpanel.init(token);

if (localStorage.getItem('drivers.enabled') === null) {
  localStorage.setItem('drivers.enabled', true);
}

var Drivers = {
  enabled: function () {
    return localStorage.getItem('drivers.enabled') === 'true';
  },
  setEnabled: function (enabled) {
    localStorage.setItem('drivers.enabled', !!enabled);
  },
  track: function (name, data) {
    data = data || {};
    if (!name) {
      return;
    }
  },
};
module.exports = Drivers;
