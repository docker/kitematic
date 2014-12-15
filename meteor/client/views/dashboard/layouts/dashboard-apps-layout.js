var exec = require('exec');
var path = require('path');

Template.dashboardAppsLayout.rendered = function () {
  Meteor.setInterval(function () {
    $('.header .icons a').tooltip();
  }, 1000);
};

Template.dashboardAppsLayout.events({
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
  'click .btn-image': function () {
    $('.header .icons a').tooltip('hide');
  },
  'click .btn-logs': function () {
    AppUtil.logs(this._id);
  },
  'click .btn-terminal': function () {
    var cmd = [Boot2Docker.command().replace(/ /g, '\\\\ '), 'ssh', '-t', 'sudo', 'docker', 'exec', '-i', '-t', this.docker.Id, 'bash'];
    Util.openTerminal(cmd);
  },
  'click .btn-restart': function () {
    AppUtil.run(this, function (err) {});
  },
  'click .btn-folder': function () {
    var appPath = path.join(Util.KITE_PATH, this.name);
    exec(['open', appPath], function (err) {
      if (err) { throw err; }
    });
  },
  'click .btn-start': function () {
    AppUtil.start(this._id);
    $('.btn-icon').tooltip('hide');
  },
  'click .btn-stop': function () {
    AppUtil.stop(this._id);
    $('.btn-icon').tooltip('hide');
  }
});
