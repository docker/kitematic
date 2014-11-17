Template.dashboard_single_app.rendered = function () {
  Meteor.setInterval(function () {
    $('.btn-icon').tooltip();
  }, 1000);
};

Template.dashboard_single_app.events({
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
  'click .btn-start': function () {
    AppUtil.start(this._id);
    $('.btn-icon').tooltip('hide');
  },
  'click .btn-stop': function () {
    AppUtil.stop(this._id);
    $('.btn-icon').tooltip('hide');
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
  'click .btn-logs': function () {
    AppUtil.logs(this._id);
  }
});
