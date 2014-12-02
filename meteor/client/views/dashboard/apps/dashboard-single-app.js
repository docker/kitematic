var remote = require('remote');
var dialog = remote.require('dialog');
var exec = require('exec');
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
  },
  changingState: function () {
    return this.status === 'STARTING' || this.status === 'STOPPING';
  }
});

Template.dashboardSingleApp.events({
  'click .btn-view': function (e) {
    try {
      e.preventDefault();
      e.stopPropagation();
      var $btn = $(e.currentTarget);
      var url = $btn.attr('href');
      exec(['open', url], function (err) {
        if (err) { throw err; }
      });
    } catch (exception) {
      console.log(exception);
    }
  },
  'click .btn-terminal': function () {
    var cmd = [Boot2Docker.command(), 'ssh', '-t', 'sudo docker exec -i -t ' + this.docker.Id + ' bash'];
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
    $('.btn-icon').tooltip('hide');
    AppUtil.run(this, function (err) {});
  },
  'click .btn-folder': function (e) {
    e.preventDefault();
    $('.btn-icon').tooltip('hide');
    var app = this;
    if (!app) {
      throw new Error('Cannot find app with id: ' + app._id);
    }

    var openDirectory = function () {
      var appPath = path.join(Util.KITE_PATH, app.name);
      if (app.docker.Volumes.length) {
        if (_.find(app.docker.Volumes, function (volume) { return volume.Value.indexOf(path.join(Util.getHomePath(), 'Kitematic')) !== -1; })) {
          exec(['open', appPath], function (stderr, stdout, code) {
            if (code) { throw stderr; }
          });
          return;
        } else {
          var volume = _.find(app.docker.Volumes, function (volume) { return volume.Value.indexOf(Util.getHomePath()) !== -1; })
          exec(['open', volume.Value], function (stderr, stdout, code) {
            if (code) { throw stderr; }
          });
          return;
        }
      } else {
        exec(['open', appPath], function (stderr, stdout, code) {
          if (code) { throw stderr; }
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
    $('.btn-icon').tooltip('hide');
  }
});
