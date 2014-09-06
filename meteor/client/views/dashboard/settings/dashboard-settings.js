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
    var install = Installs.findOne({});
    Installs.update(install._id, {
      $set: {
        tracking: true
      }
    })
  },
  'click .btn-usage-analytics-off': function () {
    var install = Installs.findOne({});
    Installs.update(install._id, {
      $set: {
        tracking: false
      }
    })
  }
});

Template.dashboard_settings.helpers({
  install: function () {
    return Installs.findOne({});
  }
});

Template.dashboard_settings.memory = function () {
  return Session.get('boot2dockerMemoryUsage');
};

Template.dashboard_settings.disk = function () {
  return Session.get('boot2dockerDiskUsage');
};
