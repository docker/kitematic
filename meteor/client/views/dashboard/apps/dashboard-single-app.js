var remote = require('remote');
var dialog = remote.require('dialog');
var exec = require('child_process').exec;

Template.dashboardSingleApp.rendered = function () {
  Meteor.setInterval(function () {
    $('.btn-icon').tooltip();
  }, 1000);
};

Template.dashboardSingleApp.helpers({
  viewPort: function () {
    var ports = this.ports();
    if (ports[0] && ports[0].web) {
      return ports[0];
    }
    return null;
  }
});

Template.dashboardSingleApp.events({
  'click .btn-view': function (e) {
    try {
      var open = require('open');
      e.preventDefault();
      e.stopPropagation();
      var $btn = $(e.currentTarget);
      var url = $btn.attr('href');
      open(url);
    } catch (exception) {
      console.log(exception);
    }
  },
  'click .btn-terminal': function () {
    var app = this;
    var cmd = Boot2Docker.command() + ' ssh -t "sudo docker exec -i -t ' + app.docker.Id + ' bash"';
    Util.openTerminal(cmd);
  },
  'click .btn-start': function (e) {
    e.preventDefault();
    AppUtil.start(this._id);
    $('.btn-icon').tooltip('hide');
  },
  'click .btn-stop': function (e) {
    e.preventDefault();
    AppUtil.stop(this._id);
    $('.btn-icon').tooltip('hide');
  },
  'click .btn-restart': function (e) {
    e.preventDefault();
    AppUtil.restart(this._id);
  },
  'click .btn-folder': function (e) {
    e.preventDefault();
    var appId = this._id;

    var app = Apps.findOne(appId);
    if (!app) {
      throw new Error('Cannot find app with id: ' + appId);
    }

    if (app.volumesEnabled) {
      exec('open ' + this.path, function (err) {
        if (err) { throw err; }
      });
      return;
    }

    dialog.showMessageBox({
      message: 'Volumes need to be enabled to view their contents via Finder. Enable volumes for this container?',
      buttons: ['Enable Volumes', 'Cancel']
    }, function (index) {
      if (index === 0) {
        Apps.update(appId, {
          $set: {volumesEnabled: true}
        });
        AppUtil.run(Apps.findOne(appId), function (err) {
          if (err) { throw err; }
          exec('open ' + this.path, function (err) {
            if (err) { throw err; }
          });
        });
      }
    });
  },
  'click .btn-logs': function (e) {
    AppUtil.logs(this._id);
  }
});
