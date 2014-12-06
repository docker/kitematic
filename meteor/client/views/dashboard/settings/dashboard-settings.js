var remote = require('remote');
var dialog = remote.require('dialog');

Template.dashboardSettings.events({
  'click .btn-usage-analytics-on': function () {
    localStorage.setItem('metrics.enabled', true);
    Session.set('metrics.enabled', true);
  },
  'click .btn-usage-analytics-off': function () {
    localStorage.setItem('metrics.enabled', false);
    Session.set('metrics.enabled', false);
  }
});

Template.dashboardSettings.helpers({
  metricsEnabled: function () {
    if (Session.get('metrics.enabled') === undefined) {
      Session.set('metrics.enabled', localStorage.getItem('metrics.enabled'));
    }
    return Session.get('metrics.enabled');
  },
  memory: function () {
    return Session.get('boot2dockerMemoryUsage');
  },
  disk: function () {
    return Session.get('boot2dockerDiskUsage');
  }
});
