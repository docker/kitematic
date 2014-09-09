var installStarted = false;
Template.setup_install.rendered = function() {
  if(!installStarted) {
    installStarted = true;
    Installer.run(function (err) {
      if (err) {
        console.log('Setup failed.');
        console.log(err);
      } else {
        Installs.insert({version: Installer.CURRENT_VERSION});
        Router.go('dashboard_apps');
      }
    });
  }
};

Template.setup_install.steps = function () {
  return Installer.steps.map(function (step, index) {
    step.index = index;
    return step;
  });
};

Template.setup_install.helpers({
  currentInstallStep: function () {
    return Session.get('currentInstallStep');
  },
  currentInstallStepProgress: function () {
    return Session.get('currentInstallStepProgress');
  },
  installComplete: function () {
    return Session.get('currentInstallStep') === Installer.steps.length;
  },
  failedStep: function () {
    return Session.get('failedStep');
  },
  failedError: function () {
    return Session.get('failedError');
  }
});
