var path = require('path');

Template.dashboard_apps_layout.rendered = function () {
  Meteor.setInterval(function () {
    $('.header .icons a').tooltip();
  }, 1000);
};

Template.dashboard_apps_layout.events({
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
  'click .btn-image': function () {
    $('.header .icons a').tooltip('hide');
  },
  'click .btn-logs': function () {
    AppUtil.logs(this._id);
  },
  'click .btn-terminal': function () {
    var cmd = Boot2Docker.command() + ' ssh -t "sudo docker-enter ' + app.docker.Id + '"';
    Util.openTerminal(cmd);
  },
  'click .btn-restart': function () {
    AppUtil.restart(this._id);
  },
  'click .btn-folder': function () {
    var exec = require('child_process').exec;
    exec('open ' + this.path, function (err) {
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
