var Dockerode = require('dockerode');
var async = require('async');
var exec = require('exec');
var path = require('path');
var fs = require('fs');

Docker = {};

Docker.hostIp = null;
Docker.hostPort = '2376';

Docker.setHost = function (host) {
  Docker.hostIp = host;
};

Docker.client = function () {
  var certDir = path.join(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'], '.boot2docker/certs/boot2docker-vm');
  if (!fs.existsSync(certDir)) {
    return null;
  }
  return new Dockerode({
    protocol: 'https',
    host: Docker.hostIp,
    port: Docker.hostPort,
    ca: fs.readFileSync(path.join(certDir, 'ca.pem')),
    cert: fs.readFileSync(path.join(certDir, 'cert.pem')),
    key: fs.readFileSync(path.join(certDir, 'key.pem'))
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
        };
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

  var containerOpts = {
    Image: image.docker.Id,
    Tty: false,
    Env: envParam,
    Hostname: app.name,
    name: app.name
  };


  if (app.docker && app.docker.NetworkSettings && app.docker.NetworkSettings.Ports) {
    containerOpts.ExposedPorts = app.docker.NetworkSettings.Ports;
  }

  Docker.client().createContainer(containerOpts, function (err, container) {
    if (err) { callback(err, null); return; }
    console.log('Created container: ' + container.id);
    // Bind volumes
    var binds = [];
    if (app.volumesEnabled && image.docker.Config.Volumes && image.docker.Config.Volumes.length > 0) {
      _.each(image.docker.Config.Volumes, function (vol) {
        if (vol.Path && vol.Path.length && vol.Path[0] === '/') {
          vol.Path = vol.Path.substr(1);
        }
        binds.push([Util.getHomePath(), 'Kitematic', app.name, vol.Path].join('/') + ':' + vol.Path);
      });
    }

    var startOpts = {
      Binds: binds
    };

    if (app.docker && app.docker.NetworkSettings && app.docker.NetworkSettings.Ports) {
      startOpts.PortBindings = app.docker.NetworkSettings.Ports;
    } else {
      startOpts.PublishAllPorts = true;
    }

    container.start(startOpts, function (err) {
      if (err) { callback(err, null); return; }
      console.log('Started container: ' + container.id);
      callback(null, container);
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
  var image = Docker.client().getImage(imageId);
  image.inspect(function (err, data) {
    if (err) {
      callback(err, null);
      return;
    }
    if (data.Config && data.Config.Volumes) {
      data.Config.Volumes = convertVolumeObjToArray(data.Config.Volumes);
    }
    if (data.ContainerConfig && data.ContainerConfig.Volumes) {
      data.ContainerConfig.Volumes = convertVolumeObjToArray(data.ContainerConfig.Volumes);
    }
    callback(null, data);
  });
};

Docker.listImages = function (opts, callback) {
  Docker.client().listImages(opts, function (err, images) {
    if (err) {
      callback(err, null);
    } else {
      var cbList = _.map(images, function (image) {
        return function (cb) {
          Docker.getImageData(image.Id, function (err, data) {
            if (err) {
              cb(err, null);
            } else {
              cb(null, _.extend(image, data));
            }
          });
        };
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
