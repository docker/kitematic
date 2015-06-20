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

if (localStorage.getItem('metrics.enabled') === null) {
  localStorage.setItem('metrics.enabled', true);
}

var Metrics = {
  enabled: function () {
    return localStorage.getItem('metrics.enabled') === 'true';
  },
  setEnabled: function (enabled) {
    localStorage.setItem('metrics.enabled', !!enabled);
  },
  track: function (name, data) {
    data = data || {};
    if (!name) {
      return;
    }

    if (localStorage.getItem('metrics.enabled') !== 'true') {
      return;
    }

    let id = localStorage.getItem('metrics.id');
    if (!id) {
      id = uuid.v4();
      localStorage.setItem('metrics.id', id);
    }

    let osName = os.platform();
    let osVersion = util.isWindows() ? os.release() : osxRelease(os.release()).version;

    mixpanel.track(name, assign({
      distinct_id: id,
      version: util.packagejson().version,
      'Operating System': osName,
      'Operating System Version': osVersion,
      'Operating System Architecture': os.arch()
    }, data));
  },

};
module.exports = Metrics;
