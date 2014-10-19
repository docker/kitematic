var remote = require('remote');
var dialog = remote.require('dialog');

Template.dashboard_settings.events({
  'click .btn-start-boot2docker': function (e) {
    var $btn = $(e.currentTarget);
    $btn.html('Starting Boot2Docker...');
    $btn.attr("disabled", "disabled");
    Session.set('boot2dockerOff', false);
    Boot2Docker.start(function (err) {
      if (err) {
        console.log(err);
      }
    });
  },
  'click .btn-stop-boot2docker': function (e) {
    var $btn = $(e.currentTarget);
    $btn.html('Stopping Boot2Docker...');
    $btn.attr("disabled", "disabled");
    Session.set('boot2dockerOff', true);
    Boot2Docker.stop(function (err) {
      if (err) {
        console.log(err);
      }
    });
  },
  'click .btn-usage-analytics-on': function () {
    var settings = Settings.findOne();
    Settings.update(settings._id, {
      $set: {
        tracking: true
      }
    });
  },
  'click .btn-usage-analytics-off': function () {
    var settings = Settings.findOne();
    Settings.update(settings._id, {
      $set: {
        tracking: false
      }
    });
  },
  'click .btn-repair': function () {
    dialog.showMessageBox({
      message: 'Repairing Kitematic will clear your current Docker VM and the state of the app. Please make sure your work is backed up. Do you wish to continue?',
      buttons: ['Repair', 'Cancel']
    }, function (index) {
      if (index !== 0) {
        return;
      }
      Router.go('setup_intro');
    });
  }
});

Template.dashboard_settings.helpers({
  settings: function () {
    return Settings.findOne({});
  },
  memory: function () {
    return Session.get('boot2dockerMemoryUsage');
  },
  disk: function () {
    return Session.get('boot2dockerDiskUsage');
  }
});
