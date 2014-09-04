var async = require('async');

Installer = {};

Installer.CURRENT_VERSION = '0.0.2';

Installer.isUpToDate = function () {
  return !!Installs.findOne({version: Installer.CURRENT_VERSION});
};

/**
 * Install steps. A step is a function that accepts a function (err) callback and returns once that step is complete.keys:
 * - run: Function that runs the installation step and calls the callback with an error if failed.
 * - pastMessage: Message to show after step completion
 * - message: Message to show while step is running
 * - imperativeMessage: Message to show before running
 */
Installer.steps = [
  {
    run: function (callback) {
      var installed = VirtualBox.installed();
      if (!installed) {
        VirtualBox.install(function (err) {
          callback(err);
        });
      } else {
        // Version 4.3.12 is required.
        VirtualBox.version(function (err, installedVersion) {
          if (err) {
            callback(err);
            return;
          }
          var needsUpdate = Util.compareVersions(installedVersion, VirtualBox.REQUIRED_VERSION) < 0;
          if (needsUpdate) {
            VirtualBox.install(function (err) {
              callback(err);
            });
          } else {
            callback();
          }
        });
      }
    },
    pastMessage: 'VirtualBox installed',
    message: 'Installing VirtualBox',
    futureMessage: 'Install VirtualBox if necessary'
  },

  // Initialize Boot2Docker if necessary.
  {
    run: function (callback) {
      Boot2Docker.exists(function (err, exists) {
        if (err) { callback(err); return; }
        if (!exists) {
          Boot2Docker.init(function (err) {
            callback(err);
          });
        } else {
          Boot2Docker.stop(function (err) {
            if (err) { callback(err); return; }
            Boot2Docker.upgrade(function (err) {
              callback(err);
            });
          });
        }
      });
    },
    pastMessage: 'Setup the Boot2Docker VM (if required)',
    message: 'Setting up the Boot2Docker VM',
    futureMessage: 'Set up the Boot2Docker VM(if required)'
  },

  {
    run: function (callback) {
      VirtualBox.addCustomHostAdapter('boot2docker-vm', function (err, ifname) {
        callback(err);
      });
    },
    pastMessage: 'Added custom host adapter to the Boot2Docker VM',
    message: 'Adding custom host adapter to the Boot2Docker VM',
    futureMessage: 'Add custom host adapter to the Boot2Docker VM'
  },

  // Start the Kitematic VM
  {
    run: function (callback) {
      Boot2Docker.state(function (err, state) {
        if (err) { callback(err); return; }
        if (state !== 'running') {
          console.log('starting');
          Boot2Docker.start(function (err) {
            callback(err);
          });
        } else {
          Boot2Docker.setIp('eth2', Boot2Docker.REQUIRED_IP, function(err) {
            callback(err);
          });
        }
      });
    },
    pastMessage: 'Started the Boot2Docker VM',
    message: 'Starting the Boot2Docker VM',
    futureMessage: 'Start the Kitematic VM'
  },

  {
    run: function (callback) {
      VirtualBox.setupRouting('boot2docker-vm', function (err, ifname) {
        callback(err);
      });
    },
    pastMessage: 'Container routing set up',
    message: 'Setting up container routing (root required)',
    futureMessage: 'Set up container routing to VM (root required)'
  },

  // Set up the default Kitematic images
  {
    run: function (callback) {
      reloadDefaultContainers(function (err) {
        if (err) { console.error(err); }
      });
    },
    pastMessage: 'Started the Boot2Docker VM',
    message: 'Setting up the default Kitematic images...',
    subMessage: '(This may take a few minutes)',
    futureMessage: 'Set up the default Kitematic images'
  }
];

Installer.run = function (callback) {
  var currentStep = 0;
  Session.set('currentInstallStep', currentStep);
  Session.set('numberOfInstallSteps', this.steps.length);
  async.eachSeries(this.steps, function (step, callback) {
    console.log('Performing step ' + currentStep);
    step.run(function (err) {
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
