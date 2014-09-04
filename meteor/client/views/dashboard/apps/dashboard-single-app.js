var path = require('path');

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
    var cmd = path.join(Util.getBinDir(), 'boot2docker') + ' ssh -t "sudo docker-enter ' + app.docker.Id + '"';
    var terminalCmd = path.join(Util.getBinDir(),  'terminal') + ' ' + cmd;
    var exec = require('child_process').exec;
    console.log(terminalCmd);
    exec(terminalCmd, function (err, stdout) {
      console.log(stdout);
      if (err) {
        console.log(err);
      }
    });
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
