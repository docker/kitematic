var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var async = require('async');
var fs = require('fs');
var path = require('path');
var exec = require('exec');
var boot2docker = require('./Boot2Docker');
var virtualbox = require('./Virtualbox');
var setupUtil = require('./SetupUtil');
var packagejson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

var _currentStep = null;
var _error = null;
var _progress = 0;

var SetupStore = assign(EventEmitter.prototype, {
  PROGRESS_EVENT: 'setup_progress',
  STEP_EVENT: 'setup_step',
  ERROR_EVENT: 'setup_error',
  downloadVirtualboxStep: {
    _download: function (callback, progressCallback) {
      setupUtil.virtualboxSHA256(packagejson['virtualbox-version'], packagejson['virtualbox-filename'], function (err, checksum) {
        if (err) {
          callback(err);
          return;
        }
        var url = 'http://download.virtualbox.org/virtualbox/' + packagejson['virtualbox-version'] +  '/' + packagejson['virtualbox-filename'];
        var downloadPath = path.join(setupUtil.supportDir(), packagejson['virtualbox-filename']);
        setupUtil.download(url, downloadPath, checksum, function (err) {
          callback(err);
        }, function (progress) {
          progressCallback(progress);
        });
      });
    },
    run: function (callback, progressCallback) {
      if (virtualbox.installed()) {
        virtualbox.version(function (err, version) {
          if (err) {callback(err); return;}
          if (setupUtil.compareVersions(version, packagejson['virtualbox-required-version']) < 0) {
            this._download(callback, progressCallback);
          } else {
            callback();
          }
        });
      } else {
        this._download(callback, progressCallback);
      }
    },
    name: 'downloading_virtualbox',
  },
  installVirtualboxStep: {
    _install: function (callback) {
      console.log('attaching');
      exec(['hdiutil', 'attach', path.join(setupUtil.supportDir(), packagejson['virtualbox-filename'])], function (stderr, stdout, code) {
        if (code) {
          callback(stderr);
          return;
        }
        console.log('Attached.');
        var iconPath = path.join(setupUtil.resourceDir(), 'kitematic.icns');
        setupUtil.isSudo(function (err, isSudo) {
          console.log(isSudo);
          sudoCmd = isSudo ? ['sudo'] : [path.join(setupUtil.resourceDir(), 'cocoasudo'), '--icon=' + iconPath, '--prompt=Kitematic requires administrative privileges to install VirtualBox and copy itself to the Applications folder.'];
          sudoCmd.push.apply(sudoCmd, ['installer', '-pkg', '/Volumes/VirtualBox/VirtualBox.pkg', '-target', '/']);
          exec(sudoCmd, function (stderr, stdout, code) {
            console.log(stdout);
            console.log('Ran installer.');
            if (code) {
              console.log(stderr);
              console.log(stdout);
              callback('Could not install virtualbox.');
            } else {
              exec(['hdiutil', 'detach', '/Volumes/VirtualBox'], function(stderr, stdout, code) {
                console.log('detaching');
                if (code) {
                  callback(stderr);
                } else {
                  callback();
                }
              });
            }
          });
        });
      });
    },
    run: function (callback) {
      var self = this;
      if (virtualbox.installed()) {
        virtualbox.version(function (err, version) {
          if (setupUtil.compareVersions(version, packagejson['virtualbox-required-version']) < 0) {
            virtualbox.kill(function (err) {
              if (err) {callback(err); return;}
              self._install(function(err) {
                callback(err);
              });
            });
          } else {
            callback();
          }
        });
      } else {
        self._install(function(err) {
          callback(err);
        });
      }
    },
    name: 'installing_virtualbox',
  },
  cleanupKitematicStep: {
    run: function (callback) {
      virtualbox.vmdestroy('kitematic-vm', function (err, removed) {
        if (err) {
          console.log(err);
        }
        callback();
      });
    },
    name: 'cleanup_kitematic',
  },
  initBoot2DockerStep: {
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
              if (err || setupUtil.compareVersions(version, boot2docker.version()) < 0) {
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
    name: 'init_boot2docker',
  },
  startBoot2DockerStep: {
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
    name: 'start_boot2docker',
  },
  stepName: function () {
    return _currentStep.name;
  },
  stepProgress: function () {
    return _progress;
  },
  run: function (callback) {
    var self = this;
    var steps = [this.downloadVirtualboxStep, this.installVirtualboxStep, this.cleanupKitematicStep, this.initBoot2DockerStep, this.startBoot2DockerStep];
    async.eachSeries(steps, function (step, callback) {
      _currentStep = step;
      _progress = 0;
      self.emit(self.STEP_EVENT);

      step.run(function (err) {
        if (err) {
          callback(err);
        } else {
          callback();
        }
      }, function (progress) {
        _progress = progress;
        self.emit(self.PROGRESS_EVENT, progress);
      });
    }, function (err) {
      if (err) {
        self.emit(self.ERROR_EVENT, _error);
        callback(err);
      } else {
        callback();
      }
    });
  }
});

module.exports = SetupStore;
