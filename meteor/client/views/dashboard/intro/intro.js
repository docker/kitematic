Template.intro.helpers({
  steps: function () {
    return Setup.steps.map(function (step, index) {
      step.index = index;
      return step;
    });
  }
});

Template.intro.helpers({
  currentSetupStepProgress: function () {
    return Session.get('currentSetupStepProgress');
  },
  currentSetupStepMessage: function () {
    return Session.get('currentSetupStepMessage')
  },
  currentSetupFailedError: function () {
    return Session.get('currentSetupFailedError')
  },
  failedError: function () {
    return Session.get('failedError');
  }
});