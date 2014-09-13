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
  failedStep: function () {
    return Session.get('failedStep');
  },
  failedError: function () {
    return Session.get('failedError');
  }
});
