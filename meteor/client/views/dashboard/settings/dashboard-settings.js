var remote = require('remote');
var dialog = remote.require('dialog');

Template.dashboardSettings.events({
  'click .btn-usage-analytics-on': function () {
    Metrics.enable();
    Session.set('metrics.enabled', true);
  },
  'click .btn-usage-analytics-off': function () {
    Metrics.disable();
    Session.set('metrics.enabled', false);
  }
});

Template.dashboardSettings.helpers({
  metricsEnabled: function () {
    if (Session.get('metrics.enabled') === undefined) {
      Metrics.enabled(function (value) {
        Session.set('metrics.enabled', value);
      });
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
