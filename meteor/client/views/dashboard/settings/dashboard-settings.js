var remote = require('remote');
var dialog = remote.require('dialog');
var level = require('levelup');
var db = level(path.join(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'], 'Library/Application Support/Kitematic/data', 'db'));

Template.dashboardSettings.events({
  'click .btn-usage-analytics-on': function () {
    db.put('metrics.enabled', true);
    Session.set('metrics.enabled', true);
  },
  'click .btn-usage-analytics-off': function () {
    db.put('metrics.enabled', false);
    Session.set('metrics.enabled', false);
  }
});

Template.dashboardSettings.helpers({
  metricsEnabled: function () {
    if (Session.get('metrics.enabled') === undefined) {
      db.get('metrics.enabled', function (err, value) {
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
