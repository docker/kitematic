var async = require('async');

// Install steps. A step is a function that accepts a function (err) callback and returns once that step is complete.
// keys:
// - install: Function that runs the installation step and calls the callback with an error if failed.
// - pastMessage: Message to show after step completion
// - message: Message to show while step is running
// - imperativeMessage: Message to show before running
var steps = [

  // Step 0, set up VirtualBox
  {
    install: function (callback) {
      isVirtualBoxInstalled(function (err, virtualBoxInstalled) {
        setupVirtualBoxAndResolver(virtualBoxInstalled, function () {
          callback();
        });
      });
    },
    pastMessage: 'VirtualBox installed',
    message: 'Installing VirtualBox',
    imperativeMessage: 'Install VirtualBox if necessary'
  },

  // Step 1: Set up the VM for running Kitematic apps
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
    imperativeMessage: 'Set up the Kitematic VM'
  },

  // Step 2: Start the Kitematic VM
  {
    install: function (callback) {
      startBoot2Docker(function (err) {
        callback(err);
      });
    },
    pastMessage: 'Started the Kitematic VM',
    message: 'Starting the Kitematic VM...',
    imperativeMessage: 'Start the Kitematic VM'
  },

  // Step 3: Set up the default Kitematic images
  {
    install: function (callback) {
      Meteor.call('reloadDefaultContainers', function (err) {
        callback(err);
      });
    },
    pastMessage: 'Started the Kitematic VM',
    message: 'Setting up the default Kitematic images...',
    imperativeMessage: 'Set up the default Kitematic images'
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
      console.log('Kitematic setup failed at step' + currentStep);
      console.log(err);
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

Template.setup_install.events({

});

Template.setup_install.steps = function () {
  return steps.map(function (step, index) {
    step.index = index;
    return step;
  });
};

Template.setup_install.helpers({
  currentInstallStep: function () {
    return Session.get('currentInstallStep');
  }
});

Template.setup_install.helpers({
  installComplete: function () {
    return Session.get('currentInstallStep') === steps.length;
  }
});
