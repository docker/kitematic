Dockerode = Meteor.require('dockerode');

var DOCKER_HOST='192.168.60.103';
docker = new Dockerode({host: DOCKER_HOST, port: '2375'});

Docker = {};

Docker.removeContainer = function (containerId, callback) {
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

Docker.removeContainerSync = function (containerId) {
  return Meteor._wrapAsync(Docker.removeContainer)(containerId);
};

Docker.getContainerData = function (containerId, callback) {
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

Docker.getContainerDataSync = function (containerId) {
  return Meteor._wrapAsync(Docker.getContainerData)(containerId);
};

Docker.runContainer = function (app, image, callback) {
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
      exec('/usr/bin/dig dig ' + app.name + '.kite @172.17.42.1 ', function() {});
      callback(null, container);
    });
  });
};

Docker.runContainerSync = function (app, image) {
  return Meteor._wrapAsync(Docker.runContainer)(app, image);
};

Docker.restartContainer = function (containerId, callback) {
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

Docker.restartContainerSync = function (containerId) {
  return Meteor._wrapAsync(Docker.restartContainer)(containerId);
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

Docker.getImageData = function (imageId, callback) {
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

Docker.getImageDataSync = function (imageId) {
  return Meteor._wrapAsync(Docker.getImageData)(imageId);
};

Docker.removeImage = function (imageId, callback) {
  var image = docker.getImage(imageId.toLowerCase());
  image.remove({force: true}, function (err) {
    if (err) { callback(err); return; }
    console.log('Deleted image: ' + imageId);
    callback(null);
  });
};

Docker.removeImageSync = function (imageId) {
  return Meteor._wrapAsync(Docker.removeImage)(imageId);
};

Docker.removeBindFolder = function (name, callback) {
  exec(path.join(Util.getBinDir(), 'boot2docker') + ' ssh "sudo rm -rf /var/lib/docker/binds/' + name + '"', function (err, stdout) {
    callback(err, stdout);
  });
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
          docker.loadImage(path.join(Util.getBinDir(), 'base-images.tar.gz'), {}, function (err) {
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

  var ready = false;
  async.until(function () {
    return ready;
  }, function (callback) {
    docker.listContainers(function (err) {
      if (!err) {
        ready = true;
      }
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
      docker.loadImage(path.join(Util.getBinDir(), 'base-images.tar.gz'), {}, function (err) {
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

Meteor.methods({
  runApp: function (app) {
    this.unblock();
    var image = Images.findOne({_id: app.imageId});
    // Delete old container if one already exists
    try {
      Docker.removeContainerSync(app.name);
    } catch (e) {}
    try {
      var container = Docker.runContainerSync(app, image);
      var containerData = Docker.getContainerDataSync(container.id);
      // Set a delay for app to spin up
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
    this.unblock();
    return Meteor._wrapAsync(reloadDefaultContainers)();
  },
  checkDefaultImages: function () {
    this.unblock();
    return Meteor._wrapAsync(checkDefaultImages)();
  },
  resolveDefaultImages: function () {
    this.unblock();
    return Meteor._wrapAsync(resolveDefaultImages)();
  },
  checkDefaultContainers: function () {
    this.unblock();
    return Meteor._wrapAsync(checkDefaultContainers)();
  },
  resolveDefaultContainers: function () {
    this.unblock();
    return Meteor._wrapAsync(resolveDefaultContainers)();
  }
});
