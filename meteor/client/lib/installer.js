var async = require('async');
var fs = require('fs');
var path = require('path');
var remote = require('remote');
var app = remote.require('app');

Installer = {};

Installer.CURRENT_VERSION = app.getVersion();
Installer.baseURL = 'https://s3.amazonaws.com/kite-installer/';

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
          if (Util.compareVersions(installedVersion, VirtualBox.REQUIRED_VERSION) < 0) {
            VirtualBox.install(function (err) {
              if (Util.compareVersions(installedVersion, VirtualBox.REQUIRED_VERSION) < 0) {
                callback('VirtualBox could not be installed. The installation either failed or was cancelled. Please try closing all VirtualBox instances and try again.');
              } else {
                callback(err);
              }
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
          var vmFilesPath = path.join(Util.getHomePath(), 'VirtualBox\ VMs', 'kitematic-vm');
          if (fs.existsSync(vmFilesPath)) {
            Util.deleteFolder(vmFilesPath);
          }
          Boot2Docker.init(function (err) {
            callback(err);
          });
        } else {
          if (!Boot2Docker.sshKeyExists()) {
            callback('Boot2Docker SSH key doesn\'t exist. Fix by deleting the existing Boot2Docker VM and re-run the installer. This usually occurs because an old version of Boot2Docker is installed.');
          } else {
            Boot2Docker.stop(function(err) {
              callback();
            });
          }
        }
      });
    },
    pastMessage: 'Setup the Boot2Docker VM (if required)',
    message: 'Setting up the Boot2Docker VM',
    futureMessage: 'Set up the Boot2Docker VM(if required)'
  },

  {
    run: function (callback) {
      VirtualBox.addCustomHostAdapter('kitematic-vm', function (err, ifname) {
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
      VirtualBox.setupRouting('kitematic-vm', function (err, ifname) {
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
      Docker.reloadDefaultContainers(function (err) {
        callback(err);
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
