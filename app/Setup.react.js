var React = require('react/addons');
var Router = require('react-router');
var Radial = require('./Radial.react.js');
var async = require('async');
var assign = require('object-assign');
var fs = require('fs');
var path = require('path');
var boot2docker = require('./boot2docker.js');
var virtualbox = require('./virtualbox.js');
var util = require('./util.js');
var docker = require('./docker.js');
var ContainerStore = require('./ContainerStore.js');

var setupSteps = [
  {
    run: function (callback, progressCallback) {
      console.log(util.supportDir());
      var installed = virtualbox.installed();
      if (!installed) {
        util.download('https://s3.amazonaws.com/kite-installer/' + virtualbox.INSTALLER_FILENAME, path.join(util.supportDir(), virtualbox.INSTALLER_FILENAME), virtualbox.INSTALLER_CHECKSUM, function (err) {
          if (err) {callback(err); return;}
          virtualbox.install(function (err) {
            if (!virtualbox.installed()) {
              callback('VirtualBox could not be installed. The installation either failed or was cancelled. Please try closing all VirtualBox instances and try again.');
            } else {
              callback(err);
            }
          });
        }, function (progress) {
          progressCallback(progress);
        });
      } else {
        virtualbox.version(function (err, installedVersion) {
          if (err) {callback(err); return;}
          if (util.compareVersions(installedVersion, virtualbox.REQUIRED_VERSION) < 0) {
            // Download a newer version of Virtualbox
            util.downloadFile(Setup.BASE_URL + virtualbox.INSTALLER_FILENAME, path.join(util.getResourceDir(), virtualbox.INSTALLER_FILENAME), virtualbox.INSTALLER_CHECKSUM, function (err) {
              if (err) {callback(err); return;}
              virtualbox.kill(function (err) {
                if (err) {callback(err); return;}
                virtualbox.install(function (err) {
                  if (err) {callback(err); return;}
                  virtualbox.version(function (err, installedVersion) {
                    if (err) {callback(err); return;}
                    if (util.compareVersions(installedVersion, virtualbox.REQUIRED_VERSION) < 0) {
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
  {
    run: function (callback) {
      virtualbox.deleteVM('kitematic-vm', function (err, removed) {
        if (err) {
          console.log(err);
        }
        callback();
      });
    },
    message: 'Cleaning up existing Docker VM...'
  },

  // Initialize Boot2Docker if necessary.
  {
    run: function (callback) {
      boot2docker.exists(function (err, exists) {
        if (err) { callback(err); return; }
        if (!exists) {
          boot2docker.init(function (err) {
            callback(err);
          });
        } else {
          if (!boot2docker.sshKeyExists()) {
            callback('Boot2Docker SSH key doesn\'t exist. Fix by removing the existing Boot2Docker VM and re-run the installer. This usually occurs because an old version of Boot2Docker is installed.');
          } else {
            boot2docker.isoVersion(function (err, version) {
              if (err || util.compareVersions(version, boot2docker.version()) < 0) {
                boot2docker.stop(function(err) {
                  boot2docker.upgrade(function (err) {
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
    message: 'Setting up the Docker VM...'
  },
  {
    run: function (callback) {
      boot2docker.waitWhileStatus('saving', function (err) {
        boot2docker.status(function (err, status) {
          if (err) {callback(err); return;}
          if (status !== 'running') {
            boot2docker.start(function (err) {
              callback(err);
            });
          } else {
            callback();
          }
        });
      });
    },
    message: 'Starting the Docker VM...'
  },
  {
    run: function (callback) {
      boot2docker.ip(function (err, ip) {
        if (err) {callback(err); return;}
        console.log('Setting host IP to: ' + ip);
        docker.setHost(ip);
        callback(err);
      });
    },
    message: 'Detecting Docker VM...'
  }
];

var Setup = React.createClass({
  mixins: [ Router.Navigation ],
  getInitialState: function () {
    return {
      message: '',
      progress: 0
    };
  },
  render: function () {
    var radial;
    if (this.state.progress) {
      radial = <Radial progress={this.state.progress}/>;
    } else if (this.state.error) {
      radial = <Radial error={true} spin="true" progress="100"/>;
    } else {
      radial = <Radial spin="true" progress="100"/>;
    }
    if (this.state.error) {
      return (
        <div className="setup">
          {radial}
          <p className="error">Error: {this.state.error}</p>
        </div>
      );
    } else {
      return (
        <div className="setup">
          {radial}
          <p>{this.state.message}</p>
        </div>
      );
    }
  },
  componentWillMount: function () {
    this.setState({});
  },
  componentDidMount: function () {
    var self = this;
    this.setup(function (err) {
      if (!err) {
        boot2docker.ip(function (err, ip) {
          docker.setHost(ip);
          ContainerStore.init(function () {
            self.transitionTo('containers');
          });
        });
      }
    });
  },
  setup: function (callback) {
    var self = this;
    var currentStep = 0;
    async.eachSeries(setupSteps, function (step, callback) {
      console.log('Performing step ' + currentStep);
      self.setState({progress: 0});
      self.setState({message: step.message});
      step.run(function (err) {
        if (err) {
          callback(err);
        } else {
          currentStep += 1;
          callback();
        }
      }, function (progress) {
        self.setState({progress: progress});
      });
    }, function (err) {
      if (err) {
        // if any of the steps fail
        console.log('Kitematic setup failed at step ' + currentStep);
        console.log(err);
        self.setState({error: err.message});
        callback(err);
      } else {
        // Setup Finished
        console.log('Setup finished.');
        callback();
      }
    });
  }
});

module.exports = Setup;
