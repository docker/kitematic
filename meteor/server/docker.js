Docker = Meteor.require('dockerode');

var Convert = Meteor.require('ansi-to-html');
var convert = new Convert();

var DOCKER_HOST='192.168.59.103';
docker = new Docker({host: '192.168.59.103', port: '2375'});

hasDockerfile = function (directory) {
  return fs.existsSync(path.join(directory, 'Dockerfile'));
};

removeContainer = function (containerId, callback) {
  var container = docker.getContainer(containerId);
  container.kill(function (err) {
    if (err) { callback(err); return; }
    container.remove({v:1}, function (err) {
      if (err) { callback(err); return; }
      console.log('Deleted container: ' + containerId);
      callback(null);
    });
  });
};

removeContainerSync = function (containerId) {
  return Meteor._wrapAsync(removeContainer)(containerId);
};

deleteApp = function (app, callback) {
  if (!app.docker) {
    callback(null);
    return;
  }
  try {
    removeContainerSync(app.docker.Id);
  } catch (e) {
    console.error(e);
  }
  callback(null);
};

deleteAppSync = function (app) {
  return Meteor._wrapAsync(deleteApp)(app);
};

getContainerData = function (containerId, callback) {
  var container = docker.getContainer(containerId);
  container.inspect(function (err, data) {
    if (err) {
      callback(err, null);
      return;
    } else {
      data.Config.Volumes = convertVolumeObjToArray(data.Config.Volumes);
      data.Volumes = convertVolumeObjToArray(data.Volumes);
      data.VolumesRW = convertVolumeObjToArray(data.VolumesRW);
      callback(null, data);
      return;
    }
  });
};

getContainerDataSync = function (containerId) {
  return Meteor._wrapAsync(getContainerData)(containerId);
};

runContainer = function (app, image, callback) {
  var envParam = [];
  _.each(_.keys(app.config), function (key) {
    var builtStr = key + '=' + app.config[key];
    envParam.push(builtStr);
  });
  console.log(envParam);
  docker.createContainer({
    Image: image._id.toLowerCase(),
    Tty: false,
    Env: envParam,
    Hostname: app.name,
    name: app.name
  }, function (err, container) {
    if (err) { callback(err, null); return; }
    console.log('Created container: ' + container.id);
    // Bind volumes
    var binds = [];
    if (image.docker.Config.Volumes.length > 0) {
      _.each(image.docker.Config.Volumes, function (vol) {
        binds.push('/var/lib/docker/binds/' + app.name + vol.Path + ':' + vol.Path);
      });
    }
    // Start the container
    container.start({
      PublishAllPorts: true,
      Binds: binds
    }, function (err) {
      if (err) { callback(err, null); return; }
      console.log('Started container: ' + container.id);
      // Use dig to refresh the DNS
      exec('/usr/bin/dig dig ' + app.name + '.dev @172.17.42.1 ', function(err, out, code) {});
      callback(null, container);
    });
  });
};

runContainerSync = function (app, image) {
  return Meteor._wrapAsync(runContainer)(app, image);
};

restartContainer = function (containerId, callback) {
  var container = docker.getContainer(containerId);
  container.restart(function (err) {
    if (err) {
      console.log(err);
      callback(err);
      return;
    }
    console.log('Restarted container: ' + containerId);
    callback(null);
  });
};

restartContainerSync = function (containerId) {
  return Meteor._wrapAsync(restartContainer)(containerId);
};

var getFromImage = function (dockerfile) {
  var patternString = "(FROM)(.*)";
  var regex = new RegExp(patternString, "g");
  var fromInstruction = dockerfile.match(regex);
  if (fromInstruction && fromInstruction.length > 0) {
    return fromInstruction[0].replace('FROM', '').trim();
  } else {
    return null;
  }
};

restartApp = function (app, callback) {
  if (app.docker && app.docker.Id) {
    restartContainerSync(app.docker.Id);
    var containerData = getContainerDataSync(app.docker.Id);
    Fiber(function () {
      Apps.update(app._id, {$set: {
        status: 'READY',
        docker: containerData
      }});
    }).run();
    callback(null);

    // Use dig to refresh the DNS
    exec('/usr/bin/dig dig ' + app.name + '.dev @172.17.42.1 ', function(err, out, code) {});
  } else {
    callback(null);
  }
};

getAppLogs = function (app) {
  if (app.docker && app.docker.Id) {
    var container = docker.getContainer(app.docker.Id);
    container.logs({follow: false, stdout: true, stderr: true, timestamps: true, tail: 300}, function (err, response) {
      if (err) { throw err; }
      Fiber(function () {
        Apps.update(app._id, {
          $set: {
            logs: []
          }
        });
      }).run();
      var logs = [];
      response.setEncoding('utf8');
      response.on('data', function (line) {
        logs.push(convert.toHtml(line.slice(8)));
        Fiber(function () {
          Apps.update(app._id, {
            $set: {
              logs: logs
            }
          });
        }).run();
      });
      response.on('end', function () {});
    });
  }
};

createTarFile = function (image, callback) {
  var TAR_PATH = path.join(KITE_TAR_PATH, image._id + '.tar');
  exec('tar czf ' + TAR_PATH + ' -C ' + image.path + ' .', function (err) {
    if (err) { callback(err, null); return; }
    console.log('Created tar file: ' + TAR_PATH);
    callback(null, TAR_PATH);
  });
};

createTarFileSync = function (image) {
  return Meteor._wrapAsync(createTarFile)(image);
};

var convertVolumeObjToArray = function (obj) {
  var result = [];
  if (obj !== null && typeof obj === 'object') {
    _.each(_.keys(obj), function (key) {
      var volumeObj = {};
      volumeObj.Path = key;
      volumeObj.Value = obj[key];
      result.push(volumeObj);
    });
  }
  return result;
};

getImageData = function (imageId, callback) {
  var image = docker.getImage(imageId.toLowerCase());
  image.inspect(function (err, data) {
    if (err) {
      callback(err, null);
      return;
    } else {
      data.Config.Volumes = convertVolumeObjToArray(data.Config.Volumes);
      data.ContainerConfig.Volumes = convertVolumeObjToArray(data.ContainerConfig.Volumes);
      callback(null, data);
      return;
    }
  });
};

getImageDataSync = function (imageId) {
  return Meteor._wrapAsync(getImageData)(imageId);
};

removeImage = function (imageId, callback) {
  var image = docker.getImage(imageId.toLowerCase());
  image.remove({force: true}, function (err) {
    if (err) { callback(err); return; }
    console.log('Deleted image: ' + imageId);
    callback(null);
  });
};

removeImageSync = function (imageId) {
  return Meteor._wrapAsync(removeImage)(imageId);
};

deleteImage = function (image, callback) {
  if (!image.docker) {
    callback(null, {});
    return;
  }
  try {
    removeImageSync(image.docker.Id);
  } catch (e) {
    console.error(e);
  }
  callback(null);
};

deleteImageSync = function (image) {
  return Meteor._wrapAsync(deleteImage)(image);
};

var defaultContainerOptions = function () {
  return [
    {
      Image: 'kite-dns',
      name: 'kite-dns',
      PortBindings: {'53/udp': [{ 'HostPort': '53', 'HostIp': '172.17.42.1' }]},
      Binds: ['/var/run/docker.sock:/tmp/docker.sock']
    }
  ];
};

checkDefaultImages = function (callback) {
  var defaultNames = defaultContainerOptions().map(function (container) {
    return container.name;
  });
  async.each(defaultNames, function (name, innerCallback) {
    var image = docker.getImage(name);
    image.inspect(function (err) {
      if (err) {
        if (err.reason === 'no such image') {
          innerCallback('no such image');
        } else {
          innerCallback(err);
        }
      } else {
        innerCallback();
      }
    });
  }, function (err) {
    if (err) {
      callback(err);
    } else {
      callback();
    }
  });
};

resolveDefaultImages = function () {
  var defaultNames = defaultContainerOptions().map(function (container) {
    return container.name;
  });
  async.each(defaultNames, function (name, innerCallback) {
    var image = docker.getImage(name);
    image.inspect(function (err) {
      if (err) {
        if (err.reason === 'no such image') {
          docker.loadImage(path.join(getBinDir(), 'base-images.tar.gz'), {}, function (err) {
            if (err) {
              innerCallback(err);
              return;
            } else {
              innerCallback();
            }
          });
        } else {
          innerCallback(err);
        }
      } else {
        innerCallback();
      }
    });
  });
};

checkDefaultContainers = function(callback) {
  var defaultNames = defaultContainerOptions().map(function (container) {
    return container.name;
  });
  async.each(defaultNames, function (name, innerCallback) {
    var container = docker.getContainer(name);
    container.inspect(function (err, data) {
      if (err) {
        innerCallback(err);
      } else {
        if (data && data.State && data.State.Running) {
          innerCallback(null);
        } else {
          innerCallback('Not running');
        }
      }
    });
  }, function (err) {
    if (err) {
      callback(err);
    } else {
      callback();
    }
  });
};

resolveDefaultContainers = function (callback) {
  var defaultNames = defaultContainerOptions().map(function (container) {
    return container.name;
  });
  killAndRemoveContainers(defaultNames, function (err) {
    if (err) {
      callback(err);
      return;
    }
    upContainers(defaultContainerOptions(), function (err) {
      callback(err);
    });
  });
};

reloadDefaultContainers = function (callback) {
  console.log('Reloading default containers.');

  var defaultNames = defaultContainerOptions().map(function (container) {
    return container.name;
  });

  var results;
  async.until(function () {
    return !!results;
  }, function (callback) {
    docker.listContainers(function (err, containers) {
      results = containers;
      callback();
    });
  }, function (err) {
    console.log(err);
    console.log('Removing old Kitematic default containers.');
    killAndRemoveContainers(defaultNames, function (err) {
      console.log('Removed old Kitematic default containers.');
      if (err) {
        console.log('Removing old Kitematic default containers ERROR.');
        callback(err);
        return;
      }
      console.log('Loading new Kitematic default images.');
      docker.loadImage(path.join(getBinDir(), 'base-images.tar.gz'), {}, function (err) {
        if (err) {
          callback(err);
          return;
        }
        console.log('Starting new Kitematic default containers.');
        upContainers(defaultContainerOptions(), function (err) {
          callback(err);
        });
      });
    });
  });
};

upContainers = function (optionsList, callback) {
   var createDefaultContainer = function (options, innerCallback) {
    docker.createContainer(options, function (err, container) {
      if (err) {
        innerCallback(err);
        return;
      }
      container.start({
        PublishAllPorts: true,
        PortBindings: options.PortBindings,
        Binds: options.Binds
      }, function (err) {
        innerCallback(err);
      });
    });
  };

  async.each(optionsList, function (options, innerCallback) {
    var container = docker.getContainer(options.name);
    container.inspect(function (err, data) {
      if (err) {
        if (err.reason.indexOf('no such container') !== -1) {
          createDefaultContainer(options, function (err) {
            innerCallback(err);
          });
        } else {
          innerCallback(err);
        }
      } else {
        if (data && !data.State.Running) {
          container.start(function (err) {
            innerCallback(err);
          });
        } else {
          innerCallback();
        }
      }
    });
  }, function (err) {
    callback(err);
  });
};

removeImages = function (names, callback) {
  async.each(names, function (name, innerCallback) {
    var image = docker.getImage(name);
    image.remove(function (err) {
      if (err) {
        console.log('remove image error');
        console.log(err);
        if (err.reason === 'no such image') {
          innerCallback();
        } else {
          innerCallback(err);
        }
      } else {
        innerCallback();
      }
    });
  }, function (err) {
    callback(err);
  });
};

killAndRemoveContainers = function (names, callback) {
  async.each(names, function (name, innerCallback) {
    var container = docker.getContainer(name);
    container.inspect(function (err, data) {
      if (err) {
        innerCallback();
        return;
      }
      if (data.State.Running) {
        // Kill it
        container.kill(function (err) {
          if (err) {
            innerCallback(err);
          } else {
            // Remove it
            container.remove(function (err) {
              innerCallback(err);
            });
          }
        });
      } else {
        container.remove(function (err) {
          innerCallback(err);
        });
      }
    });
  }, function (err) {
    callback(err);
  });
};

pullImageFromDockerfile = function (dockerfile, imageId, callback) {
  var fromImage = getFromImage(dockerfile);
  console.log('From image: ' + fromImage);
  if (fromImage) {
    Fiber(function () {
      Images.update(imageId, {
        $set: {
          buildLogs: []
        }
      });
    }).run();
    var logs = [];
    docker.pull(fromImage, function (err, response) {
      if (err) { callback(err); return; }
      response.setEncoding('utf8');
      response.on('data', function (data) {
        try {
          var logData = JSON.parse(data);
          var logDisplay = '';
          if (logData.id) {
            logDisplay += logData.id + ' | ';
          }
          logDisplay += logData.status;
          if (logData.progressDetail && logData.progressDetail.current && logData.progressDetail.total) {
            logDisplay += ' - ' + Math.round(logData.progressDetail.current / logData.progressDetail.total * 100) + '%';
          }
          logs.push(logDisplay);
          Fiber(function () {
            Images.update(imageId, {
              $set: {
                buildLogs: logs
              }
            });
          }).run();
        } catch (e) {
          console.error(e);
        }
      });
      response.on('end', function () {
        console.log('Finished pulling image: ' + fromImage);
        callback(null);
      });
    });
  }
};

buildImage = function (image, callback) {
  Fiber(function () {
    var tarFilePath = createTarFileSync(image);
    Images.update(image._id, {
      $set: {
        buildLogs: []
      }
    });
    docker.buildImage(tarFilePath, {t: image._id.toLowerCase()}, function (err, response) {
      if (err) { callback(err); }
      console.log('Building Docker image...');
      var logs = [];
      response.setEncoding('utf8');
      response.on('data', function (data) {
        try {
          var line = JSON.parse(data).stream;
          logs.push(convert.toHtml(line));
          Fiber(function () {
            Images.update(image._id, {
              $set: {
                buildLogs: logs
              }
            });
          }).run();
        } catch (e) {
          console.error(e);
        }
      });
      response.on('end', function () {
        console.log('Finished building Docker image.');
        try {
          fs.unlinkSync(tarFilePath);
          console.log('Cleaned up tar file.');
        } catch (e) {
          console.error(e);
        }
        Fiber(function () {
          try {
            var imageData = getImageDataSync(image._id);
            var oldImageId = null;
            Images.update(image._id, {
              $set: {
                docker: imageData,
                status: 'READY'
              }
            });
          } catch (e) {
            console.log(e);
            Images.update(image._id, {
              $set: {
                status: 'ERROR'
              }
            });
          }
          if (image.docker && image.docker.Id) {
            oldImageId = image.docker.Id;
          }
          if (oldImageId && oldImageId !== imageData.Id) {
            removeImageSync(oldImageId);
          }
        }).run();
        callback(null);
      });
    });
  }).run();
};

Meteor.methods({
  runApp: function (app) {
    this.unblock();
    var image = Images.findOne({_id: app.imageId});
    try {
      removeContainerSync(app.name);
    } catch (e) {}
    try {
      var container = runContainerSync(app, image);
      var containerData = getContainerDataSync(container.id);
      Meteor.setTimeout(function () {
        Apps.update(app._id, {$set: {
          docker: containerData,
          status: 'READY'
        }});
      }, 2500);
    } catch (e) {
      console.error(e);
    }
  },
  getDockerHost: function () {
    return DOCKER_HOST;
  },
  reloadDefaultContainers: function () {
    return Meteor._wrapAsync(reloadDefaultContainers)();
  },
  checkDefaultImages: function () {
    return Meteor._wrapAsync(checkDefaultImages)();
  },
  resolveDefaultImages: function () {
    return Meteor._wrapAsync(resolveDefaultImages)();
  },
  checkDefaultContainers: function () {
    return Meteor._wrapAsync(checkDefaultContainers)();
  },
  resolveDefaultContainers: function () {
    return Meteor._wrapAsync(resolveDefaultContainers)();
  }
});
