var remote = require('remote');
var app = remote.require('app');
var crypto = require('crypto');
var getmac = require('getmac');
var uuid = require('node-uuid');

var Mixpanel = require('mixpanel');
var mixpanel = Mixpanel.init(Meteor.settings.public.mixpanel.token);

Metrics = {};

Metrics.trackEvent = function (name) {
  if (!name) {
    return;
  }
  var uuid = localStorage.getItem('metrics.uuid');
  if (localStorage.getItem('metrics.enabled') && uuid) {
    mixpanel.track('docker_gui ' + name, {
      distinct_id: uuid,
      version: app.getVersion()
    });
  }
};

Metrics.prepareTracking = function () {
  if (localStorage.getItem('metrics.enabled') === null) {
    var settings = Settings.findOne();
    if (settings && settings.tracking) {
      localStorage.setItem('metrics.enabled', !!settings.tracking);
    } else {
      localStorage.setItem('metrics.enabled', true);
    }
  }
  if (!localStorage.getItem('metrics.uuid')) {
    localStorage.setItem('metrics.uuid', uuid.v4());
  }
};
