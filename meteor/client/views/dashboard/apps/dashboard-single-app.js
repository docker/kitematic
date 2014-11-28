var remote = require('remote');
var dialog = remote.require('dialog');
var exec = require('child_process').exec;
var path = require('path');

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
    AppUtil.run(this, function (err) {});
  },
  'click .btn-folder': function (e) {
    e.preventDefault();
    var app = this;
    if (!app) {
      throw new Error('Cannot find app with id: ' + app._id);
    }

    var openDirectory = function () {
      var appPath = path.join(Util.KITE_PATH, app.name);
      if (app.docker.Volumes.length) {
        if (app.docker.Volumes[0].Value.indexOf(path.join(Util.getHomePath(), 'Kitematic')) !== -1) {
          exec('open ' + appPath, function (err) {
            if (err) { throw err; }
          });
          return;
        } else {
          exec('open ' + app.docker.Volumes[0].Value, function (err) {
            if (err) { throw err; }
          });
          return;
        }
      } else {
        exec('open ' + appPath, function (err) {
          if (err) { throw err; }
        });
      }
    };

    if (app.volumesEnabled) {
      openDirectory();
      return;
    }

    dialog.showMessageBox({
      message: 'Volumes need to be enabled to view their contents via Finder. Enable volumes for this container?',
      buttons: ['Enable Volumes', 'Cancel']
    }, function (index) {
      if (index === 0) {
        Apps.update(app._id, {
          $set: {volumesEnabled: true}
        });
        AppUtil.run(Apps.findOne(app._id), function (err) {
          if (err) { throw err; }
          openDirectory();
        });
      }
    });
  },
  'click .btn-logs': function (e) {
    AppUtil.logs(this._id);
  }
});
