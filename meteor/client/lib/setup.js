var async = require('async');
var fs = require('fs');
var path = require('path');
var remote = require('remote');
var app = remote.require('app');

Setup = {};

Setup.CURRENT_VERSION = app.getVersion();
Setup.BASE_URL = 'https://s3.amazonaws.com/kite-installer/';

Setup.isUpToDate = function () {
  return !!Installs.findOne({version: Setup.CURRENT_VERSION});
};

/**
 * Install steps. A step is a function that accepts a function (err) callback and returns once that step is complete.keys:
 * - run: Function that runs the installation step and calls the callback with an error if failed.
 * - message: Message to show while step is running
 */
Setup.steps = [
  {
    run: function (callback, progressCallback) {
      var installed = VirtualBox.installed();
      if (!installed) {
        Util.downloadFile(Setup.BASE_URL + VirtualBox.INSTALLER_FILENAME, path.join(Util.getResourceDir(), VirtualBox.INSTALLER_FILENAME), VirtualBox.INSTALLER_CHECKSUM, function (err) {
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
        VirtualBox.version(function (err, installedVersion) {
          if (err) {callback(err); return;}
          if (Util.compareVersions(installedVersion, VirtualBox.REQUIRED_VERSION) < 0) {
            // Download a newer version of Virtualbox
            Util.downloadFile(Setup.BASE_URL + VirtualBox.INSTALLER_FILENAME, path.join(Util.getResourceDir(), VirtualBox.INSTALLER_FILENAME), VirtualBox.INSTALLER_CHECKSUM, function (err) {
              if (err) {callback(err); return;}
              VirtualBox.killAllProcesses(function (err) {
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
    message: 'Downloading VirtualBox...'
  },

  // Initialize Boot2Docker if necessary.
  {
    run: function (callback) {
      Boot2Docker.exists(function (err, exists) {
        if (err) { callback(err); return; }
        if (!exists) {
          var vmFilesPath = path.join(Util.getHomePath(), 'VirtualBox\ VMs', 'boot2docker-vm');
          if (fs.existsSync(vmFilesPath)) {
            Util.deleteFolder(vmFilesPath);
          }
          Boot2Docker.init(function (err) {
            callback(err);
          });
        } else {
          if (!Boot2Docker.sshKeyExists()) {
            callback('Boot2Docker SSH key doesn\'t exist. Fix by removing the existing Boot2Docker VM and re-run the installer. This usually occurs because an old version of Boot2Docker is installed.');
          } else {
            Boot2Docker.vmUpToDate(function (err, upToDate) {
              if (err) {callback(err); return;}
              if (!upToDate) {
                Boot2Docker.stop(function(err) {
                  Boot2Docker.upgrade(function (err) {
                    callback(err);
                  });
                });
              } else {
                callback();
              }
            });
          } 
        }
      });
    },
    message: 'Setting up the Docker VM...',
  },

  // Start the Docker VM
  {
    run: function (callback) {
      Boot2Docker.state(function (err, state) {
        if (err) {callback(err); return;}
        if (state !== 'running') {
          Boot2Docker.start(function (err) {
            callback(err);
          });
        } else {
          callback();
        }
      });
    },
    message: 'Starting the Docker VM...',
  },

  {
    run: function (callback) {
      Boot2Docker.ip(function (err, ip) {
        if (err) {callback(err); return;}
        console.log('Setting host IP to: ' + ip);
        Docker.setHost(ip);
        callback(err);
      });
    },
    message: 'Detecting Docker VM...'
  }
];

Setup.run = function (callback) {
  var currentStep = 0;
  Session.set('currentSetupStepMessage', currentStep);
  async.eachSeries(this.steps, function (step, callback) {
    console.log('Performing step ' + currentStep);
    Session.set('currentSetupStepProgress', 0);
    Session.set('currentSetupStepMessage', step.message);
    step.run(function (err) {
      if (err) {
        callback(err);
      } else {
        currentStep += 1;
        callback();
      }
    }, function (progress) {
      Session.set('currentSetupStepProgress', progress);
    });
  }, function (err) {
    if (err) {
      // if any of the steps fail
      console.log('Kitematic setup failed at step ' + currentStep);
      console.log(err);
      Session.set('currentSetupFailedError', err);
      callback(err);
    } else {
      // Setup Finished
      console.log('Setup finished.');
      callback();
    }
  });
};
