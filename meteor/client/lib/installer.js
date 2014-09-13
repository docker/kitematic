var async = require('async');
var fs = require('fs');
var path = require('path');
var remote = require('remote');
var app = remote.require('app');

Installer = {};

Installer.CURRENT_VERSION = app.getVersion();
Installer.BASE_URL = 'https://s3.amazonaws.com/kite-installer/';

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
    run: function (callback, progressCallback) {
      var installed = VirtualBox.installed();
      if (!installed) {
        Util.downloadFile(Installer.BASE_URL + VirtualBox.INSTALLER_FILENAME, path.join(Util.getResourceDir(), VirtualBox.INSTALLER_FILENAME), VirtualBox.INSTALLER_CHECKSUM, function (err) {
          if (err) {callback(err); return;}
          VirtualBox.install(function (err) {
            if (!VirtualBox.installed()) {
              callback('VirtualBox could not be installed. The installation either failed or was cancelled. Please try closing all VirtualBox instances and try again.');
            } else {
              callback(err);
            }
          });
        }, function (progress) {
          progressCallback(progress);
        });
      } else {
        // Version 4.3.12 is required.
        VirtualBox.version(function (err, installedVersion) {
          if (err) {callback(err); return;}
          if (Util.compareVersions(installedVersion, VirtualBox.REQUIRED_VERSION) < 0) {
            // Download a newer version of Virtualbox
            Util.downloadFile(Installer.BASE_URL + VirtualBox.INSTALLER_FILENAME, path.join(Util.getResourceDir(), VirtualBox.INSTALLER_FILENAME), VirtualBox.INSTALLER_CHECKSUM, function (err) {
              if (err) {callback(err); return;}
              VirtualBox.install(function (err) {
                if (err) {callback(err); return;}
                VirtualBox.version(function (err, installedVersion) {
                  if (err) {callback(err); return;}
                  if (Util.compareVersions(installedVersion, VirtualBox.REQUIRED_VERSION) < 0) {
                    callback('VirtualBox could not be installed. The installation either failed or was cancelled. Please try closing all VirtualBox instances and try again.');
                  } else {
                    callback(err);
                  }
                });
              });
            }, function (progress) {
              progressCallback(progress);
            });
          } else {
            callback();
          }
        });
      }
    },
    pastMessage: 'VirtualBox installed',
    message: 'Downloading & Installing VirtualBox',
    futureMessage: 'Download & Install VirtualBox if necessary'
  },

  // Initialize Boot2Docker if necessary.
  {
    run: function (callback) {
      Boot2Docker.exists(function (err, exists) {
        if (err) { callback(err); return; }
        if (!exists) {
          var vmFilesPath = path.join(Util.getHomePath(), 'VirtualBox\\ VMs', 'kitematic-vm');
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
              Boot2Docker.upgrade(function (err) {
                callback(err);
              });
            });
          }
        }
      });
    },
    pastMessage: 'Setup the Kitematic VM (if required)',
    message: 'Setting up the Kitematic VM',
    futureMessage: 'Set up the Kitematic VM (if required)'
  },

  {
    run: function (callback) {
      VirtualBox.addCustomHostAdapter('kitematic-vm', function (err, ifname) {
        callback(err);
      });
    },
    pastMessage: 'Added custom host adapter to the Kitematic VM',
    message: 'Adding custom host adapter to the Kitematic VM',
    futureMessage: 'Add custom host adapter to the Kitematic VM'
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
    pastMessage: 'Started the Kitematic VM',
    message: 'Starting the Kitematic VM',
    subMessage: '(This may take a few minutes)',
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
    run: function (callback, progressCallback) {
      Util.downloadFile(Installer.BASE_URL + Docker.DEFAULT_IMAGES_FILENAME, path.join(Util.getResourceDir(), Docker.DEFAULT_IMAGES_FILENAME), Docker.DEFAULT_IMAGES_CHECKSUM, function (err) {
        Docker.reloadDefaultContainers(function (err) {
          callback(err);
        });
      }, function (progress) {
        progressCallback(progress);
      });
    },
    pastMessage: 'Set up the default Kitematic images.',
    message: 'Setting up the default Kitematic images...',
    subMessage: '(This may take a few minutes)',
    futureMessage: 'Set up the default Kitematic images'
  }
];

Installer.run = function (callback) {
  Session.set('installing', true);
  var currentStep = 0;
  Session.set('currentInstallStep', currentStep);
  Session.set('numberOfInstallSteps', this.steps.length);
  async.eachSeries(this.steps, function (step, callback) {
    console.log('Performing step ' + currentStep);
    Session.set('currentInstallStepProgress', 0);
    step.run(function (err) {
      if (err) {
        callback(err);
      } else {
        currentStep += 1;
        Session.set('currentInstallStep', currentStep);
        callback();
      }
    }, function (progress) {
      Session.set('currentInstallStepProgress', progress);
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
      Session.set('installing', false);
      console.log('Setup finished.');
      callback();
    }
  });
};
