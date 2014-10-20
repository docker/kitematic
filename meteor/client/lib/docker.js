var Dockerode = require('dockerode');
var async = require('async');
var exec = require('exec');
var path = require('path');
var fs = require('fs');

Docker = {};

Docker.DEFAULT_IMAGES_FILENAME = 'base-images-0.0.2.tar.gz';
Docker.DEFAULT_IMAGES_CHECKSUM = 'a3517ac21034a1969d9ff15e3c41b1e2f1aa83c67b16a8bd0bc378ffefaf573b'; // Sha256 Checksum
Docker.CERT_DIR = path.join(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'], '.boot2docker/certs/kitematic-vm');
Docker.HOST_IP = '192.168.60.103';
Docker.HOST_PORT = '2376';

Docker.client = function () {
  return new Dockerode({
    protocol: 'https',
    host: Docker.HOST_IP,
    port: Docker.HOST_PORT,
    ca: fs.readFileSync(path.join(Docker.CERT_DIR, 'ca.pem')),
    cert: fs.readFileSync(path.join(Docker.CERT_DIR, 'cert.pem')),
    key: fs.readFileSync(path.join(Docker.CERT_DIR, 'key.pem'))
  });
};

Docker.removeContainer = function (containerId, callback) {
  var container = Docker.client().getContainer(containerId);
  container.kill(function (err) {
    if (err) { callback(err); return; }
    container.remove({v:1}, function (err) {
      if (err) { callback(err); return; }
      console.log('Deleted container: ' + containerId);
      callback(null);
    });
  });
};

Docker.listContainers = function (callback) {
  Docker.client().listContainers({all: true}, function (err, containers) {
    if (err) {
      callback(err, null);
    } else {
      var cbList = _.map(containers, function (container) {
        return function (cb) {
          Docker.getContainerData(container.Id, function (err, data) {
            if (err) {
              cb(err, null);
            } else {
              cb(null, data);
            }
          });
        }
      });
      async.parallel(cbList, function (err, results) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, results);
        }
      });
    }
  });
};

Docker.getContainerData = function (containerId, callback) {
  var container = Docker.client().getContainer(containerId);
  container.inspect(function (err, data) {
    if (err) {
      callback(err, null);
      return;
    } else {
      if (data.Config && data.Config.Volumes) {
        data.Config.Volumes = convertVolumeObjToArray(data.Config.Volumes);
      }
      if (data.Volumes) {
        data.Volumes = convertVolumeObjToArray(data.Volumes);
      }
      if (data.VolumesRW) {
        data.VolumesRW = convertVolumeObjToArray(data.VolumesRW);
      }
      callback(null, data);
      return;
    }
  });
};

Docker.runContainer = function (app, image, callback) {
  var envParam = [];
  _.each(_.keys(app.config), function (key) {
    var builtStr = key + '=' + app.config[key];
    envParam.push(builtStr);
  });
  console.log(envParam);
  Docker.client().createContainer({
    Image: image.docker.Id,
    Tty: false,
    Env: envParam,
    Hostname: app.name,
    name: app.name
  }, function (err, container) {
    if (err) { callback(err, null); return; }
    console.log('Created container: ' + container.id);
    // Bind volumes
    var binds = [];
    if (image.docker.Config.Volumes && image.docker.Config.Volumes.length > 0) {
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
      Util.refreshDNS(app, function (err) {
        if (err) {
          console.error(err);
        }
        callback(null, container);
      });
    });
  });
};

Docker.startContainer = function (containerId, callback) {
  var container = Docker.client().getContainer(containerId);
  container.start(function (err) {
    if (err) {
      console.log(err);
      callback(err);
      return;
    }
    console.log('Started container: ' + containerId);
    callback(null);
  });
};

Docker.stopContainer = function (containerId, callback) {
  var container = Docker.client().getContainer(containerId);
  container.stop(function (err) {
    if (err) {
      console.log(err);
      callback(err);
      return;
    }
    console.log('Stopped container: ' + containerId);
    callback(null);
  });
};

Docker.restartContainer = function (containerId, callback) {
  var container = Docker.client().getContainer(containerId);
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
  Docker.client().listImages({all: false}, function (err, images) {
    if (err) {
      callback(err, null);
    } else {
      var dockerImage = _.find(images, function (image) {
        return image.Id === imageId;
      });
      var image = Docker.client().getImage(imageId);
      image.inspect(function (err, data) {
        if (err) {
          callback(err, null);
        } else {
          if (data.Config && data.Config.Volumes) {
            data.Config.Volumes = convertVolumeObjToArray(data.Config.Volumes);
          }
          if (data.ContainerConfig && data.ContainerConfig.Volumes) {
            data.ContainerConfig.Volumes = convertVolumeObjToArray(data.ContainerConfig.Volumes);
          }
          if (!dockerImage) {
            callback(null, data);
          } else {
            callback(null, _.extend(dockerImage, data));
          }
        }
      });
    }
  });
};

Docker.listImages = function (callback) {
  Docker.client().listImages({all: false}, function (err, images) {
    if (err) {
      callback(err, null);
    } else {
      var cbList = _.map(images, function (image) {
        return function (cb) {
          Docker.getImageData(image.Id, function (err, data) {
            if (err) {
              cb(err, null);
            } else {
              cb(null, data);
            }
          });
        }
      });
      async.parallel(cbList, function (err, results) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, results);
        }
      });
    }
  });
};

Docker.removeImage = function (imageId, callback) {
  var image = Docker.client().getImage(imageId);
  image.remove({force: true}, function (err) {
    if (err) { callback(err); return; }
    console.log('Deleted image: ' + imageId);
    callback(null);
  });
};

Docker.removeBindFolder = function (name, callback) {
  exec(Boot2Docker.command() + ' ssh "sudo rm -rf /var/lib/docker/binds/' + name + '"', function (err, stdout) {
    callback(err, stdout);
  });
};

Docker.defaultContainerOptions = function () {
  return [
    {
      Image: 'kite-dns',
      name: 'kite-dns',
      PortBindings: {'53/udp': [{ 'HostPort': '53', 'HostIp': '172.17.42.1' }]},
      Binds: ['/var/run/docker.sock:/tmp/docker.sock']
    }
  ];
};

Docker.defaultContainerNames = Docker.defaultContainerOptions().map(function (container) {
  return container.name;
});

Docker.checkDefaultImages = function (callback) {
  var defaultNames = Docker.defaultContainerNames;
  async.each(defaultNames, function (name, innerCallback) {
    var image = Docker.client().getImage(name);
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

Docker.resolveDefaultImages = function () {
  async.each(Docker.defaultContainerNames, function (name, innerCallback) {
    var image = Docker.client().getImage(name);
    image.inspect(function (err) {
      if (err) {
        if (err.reason === 'no such image') {
          Docker.client().loadImage(path.join(Util.getBinDir(), Docker.DEFAULT_IMAGES_FILENAME), {}, function (err) {
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

Docker.checkDefaultContainers = function(callback) {
  async.each(Docker.defaultContainerNames, function (name, innerCallback) {
    var container = Docker.client().getContainer(name);
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

Docker.resolveDefaultContainers = function (callback) {
  Docker.killAndRemoveContainers(Docker.defaultContainerNames, function (err) {
    if (err) {
      callback(err);
      return;
    }
    Docker.upContainers(Docker.defaultContainerOptions(), function (err) {
      callback(err);
    });
  });
};

Docker.reloadDefaultContainers = function (callback) {
  console.log('Reloading default containers.');
  var ready = false;
  async.until(function () {
    return ready;
  }, function (callback) {
    Docker.client().listContainers(function (err) {
      if (!err) {
        ready = true;
      }
      callback();
    });
  }, function () {
    console.log('Removing old Kitematic default containers.');
    Docker.killAndRemoveContainers(Docker.defaultContainerNames, function (err) {
      console.log('Removed old Kitematic default containers.');
      if (err) {
        console.log('Removing old Kitematic default containers ERROR.');
        callback(err);
        return;
      }
      console.log('Loading new Kitematic default images.');
      Docker.client().loadImage(path.join(Util.getResourceDir(), Docker.DEFAULT_IMAGES_FILENAME), {}, function (err) {
        if (err) {
          callback(err);
          return;
        }
        console.log('Starting new Kitematic default containers.');
        Docker.upContainers(Docker.defaultContainerOptions(), function (err) {
          callback(err);
        });
      });
    });
  });
};

Docker.upContainers = function (optionsList, callback) {
   var createDefaultContainer = function (options, innerCallback) {
    Docker.client().createContainer(options, function (err, container) {
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
    var container = Docker.client().getContainer(options.name);
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

Docker.removeImages = function (names, callback) {
  async.each(names, function (name, innerCallback) {
    var image = Docker.client().getImage(name);
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

Docker.killAndRemoveContainers = function (names, callback) {
  async.each(names, function (name, innerCallback) {
    var container = Docker.client().getContainer(name);
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
