var async = require('async');

// Install steps. A step is a function that accepts a function (err) callback and returns once that step is complete.
// keys:
// - install: Function that runs the installation step and calls the callback with an error if failed.
// - pastMessage: Message to show after step completion
// - message: Message to show while step is running
// - imperativeMessage: Message to show before running
var steps = [

  // Set up VirtualBox
  {
    install: function (callback) {
      isVirtualBoxInstalled(function (err, virtualBoxInstalled) {
        if (!virtualBoxInstalled) {
          setupVirtualBox(function (err) {
            callback(err);
          });
        } else {
          callback();
        }
      });
    },
    pastMessage: 'VirtualBox installed',
    message: 'Installing VirtualBox',
    futureMessage: 'Install VirtualBox if necessary'
  },

  // Set up the routing.
  {
    install: function (callback) {
      setupResolver(function (err) {
        callback(err);
      });
    },
    pastMessage: 'Container routing set up (root required).',
    message: 'Setting up container routing (root required).',
    subMessage: '(This may take a few minutes)',
    futureMessage: 'Set up container routing to VM (root required).'
  },

  // Set up the VM for running Kitematic apps
  {
    install: function (callback) {
      console.log('Checking if vm exists...');
      boot2DockerVMExists(function (err, exists) {
        console.log('VM exists: ' + exists);
        if (exists) {
          console.log('Stopping vm');
          stopBoot2Docker(function () {
            console.log('Upgrading vm');
            upgradeBoot2Docker(function () {
              callback();
            });
          });
        } else {
          console.log('init VM');
           initBoot2Docker(function () {
            callback();
          });
        }
      });
    },
    pastMessage: 'Set up the Kitematic VM',
    message: 'Setting up the Kitematic VM...',
    futureMessage: 'Set up the Kitematic VM'
  },

  // Start the Kitematic VM
  {
    install: function (callback) {
      startBoot2Docker(function (err) {
        callback(err);
      });
    },
    pastMessage: 'Started the Kitematic VM',
    message: 'Starting the Kitematic VM',
    subMessage: '(This may take a few minutes)',
    futureMessage: 'Start the Kitematic VM'
  },

  // Set up the default Kitematic images
  {
    install: function (callback) {
      Meteor.call('reloadDefaultContainers', function (err) {
        callback(err);
      });
    },
    pastMessage: 'Started the Kitematic VM',
    message: 'Setting up the default Kitematic images...',
    subMessage: '(This may take a few minutes)',
    futureMessage: 'Set up the default Kitematic images'
  }
];

runSetup = function (callback) {
  // Run through the Kitematic installation, skipping steps if required.
  var currentStep = 0;
  Session.set('currentInstallStep', currentStep);
  Session.set('numberOfInstallSteps', steps.length);
  async.eachSeries(steps, function (step, callback) {
    console.log('Performing step ' + currentStep);
    step.install(function (err) {
      if (err) {
        callback(err);
      } else {
        currentStep += 1;
        Session.set('currentInstallStep', currentStep);
        callback();
      }
    });
  }, function (err) {
    if (err) {
      // if any of the steps fail
      console.log('Kitematic setup failed at step ' + currentStep);
      console.log(err);
      Session.set('failedStep', currentStep);
      Session.set('failedError', err);
      callback(err);
    } else {
      // Setup Finished
      console.log('Setup finished.');
      callback();
    }
  });
};

var installStarted = false;
Template.setup_install.rendered = function() {
  if(!installStarted) {
    installStarted = true;
    runSetup(function (err) {
      if (err) {
        console.log('Setup failed.');
        console.log(err);
      } else {
        Installs.insert({});
        startFixInterval();
        Router.go('dashboard_apps');
      }
    });
  }
};

Template.setup_install.steps = function () {
  return steps.map(function (step, index) {
    step.index = index;
    return step;
  });
};

Template.setup_install.helpers({
  currentInstallStep: function () {
    return Session.get('currentInstallStep');
  },
  installComplete: function () {
    return Session.get('currentInstallStep') === steps.length;
  },
  failedStep: function () {
    return Session.get('failedStep');
  },
  failedError: function () {
    return Session.get('failedError');
  }
});
