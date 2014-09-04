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
    var buildCmd = function (dockerId, termApp) {
      return "echo 'boot2docker --vm=\"boot2docker-vm\" ssh -t \"sudo docker-enter " + dockerId + "\"' > /tmp/nsenter-start && chmod +x /tmp/nsenter-start && open -a " + termApp + " /tmp/nsenter-start";
    };
    var app = this;
    var nsenterCmd = buildCmd(app.docker.Id, 'iTerm.app');
    var exec = require('child_process').exec;
    exec(nsenterCmd, function (err) {
      if (err) {
        nsenterCmd = buildCmd(app.docker.Id, 'Terminal.app');
        exec(nsenterCmd, function (err) {
          if (err) { throw err; }
        });
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
  }
});
