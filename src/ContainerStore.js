var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var path = require('path');
var assign = require('object-assign');
var docker = require('./Docker');
var metrics = require('./Metrics');
var registry = require('./Registry');
var LogStore = require('./LogStore');

var _placeholders = {};
var _containers = {};
var _progress = {};
var _muted = {};

var ContainerStore = assign(Object.create(EventEmitter.prototype), {
  CLIENT_CONTAINER_EVENT: 'client_container_event',
  SERVER_CONTAINER_EVENT: 'server_container_event',
  SERVER_PROGRESS_EVENT: 'server_progress_event',
  _pullImage: function (repository, tag, callback, progressCallback) {
    registry.layers(repository, tag, function (err, layerSizes) {

      // TODO: Support v2 registry API
      // TODO: clean this up- It's messy to work with pulls from both the v1 and v2 registry APIs
      // Use the per-layer pull progress % to update the total progress.
      docker.client().listImages({all: 1}, function(err, images) {
        images = images || [];
        var existingIds = new Set(images.map(function (image) {
          return image.Id.slice(0, 12);
        }));
        var layersToDownload = layerSizes.filter(function (layerSize) {
          return !existingIds.has(layerSize.Id);
        });

        var totalBytes = layersToDownload.map(function (s) { return s.size; }).reduce(function (pv, sv) { return pv + sv; }, 0);
        docker.client().pull(repository + ':' + tag, function (err, stream) {
          stream.setEncoding('utf8');

          var layerProgress = layersToDownload.reduce(function (r, layer) {
            if (_.findWhere(images, {Id: layer.Id})) {
              r[layer.Id] = 100;
            } else {
              r[layer.Id] = 0;
            }
            return r;
          }, {});

          stream.on('data', function (str) {
            var data = JSON.parse(str);
            console.log(data);

            if (data.status === 'Already exists') {
              layerProgress[data.id] = 1;
            } else if (data.status === 'Downloading') {
              var current = data.progressDetail.current;
              var total = data.progressDetail.total;
              var layerFraction = current / total;
              layerProgress[data.id] = layerFraction;
            }

            var chunks = layersToDownload.map(function (s) {
              return layerProgress[s.Id] * s.size;
            });

            var totalReceived = chunks.reduce(function (pv, sv) {
              return pv + sv;
            }, 0);

            var totalProgress = totalReceived / totalBytes;
            progressCallback(totalProgress);
          });
          stream.on('end', function () {
            callback();
          });
        });
      });
    });
  },
  _createContainer: function (name, containerData, callback) {
    var existing = docker.client().getContainer(name);
    var self = this;
    if (!containerData.name && containerData.Name) {
      containerData.name = containerData.Name;
    } else if (!containerData.name) {
      containerData.name = name;
    }
    if (containerData.Config && containerData.Config.Image) {
      containerData.Image = containerData.Config.Image;
    }
    existing.kill(function () {
      existing.remove(function () {
        docker.client().getImage(containerData.Image).inspect(function (err, data) {
          if (err) {
            callback(err);
            return;
          }
          var binds = containerData.Binds || [];
          if (data.Config.Volumes) {
            _.each(data.Config.Volumes, function (value, key) {
              var existingBind = _.find(binds, b => {
                return b.indexOf(':' + key) !== -1;
              });
              if (!existingBind) {
                binds.push(path.join(process.env.HOME, 'Kitematic', containerData.name, key)+ ':' + key);
              }
            });
          }
          docker.client().createContainer(containerData, function (err, container) {
            if (err) {
              callback(err, null);
              return;
            }
            if (containerData.State && !containerData.State.Running) {
              self.fetchContainer(containerData.name, callback);
            } else {
              container.start({
                PublishAllPorts: true,
                Binds: binds
              }, function (err) {
                if (err) {
                  callback(err);
                  return;
                }
                self.fetchContainer(containerData.name, callback);
              });
            }
          });
        });
      });
    });
  },
  _generateName: function (repository) {
    var base = _.last(repository.split('/'));
    var count = 1;
    var name = base;
    while (true) {
      var exists = _.findWhere(_.values(_containers), {Name: name}) || _.findWhere(_.values(_containers), {Name: name});
      if (!exists) {
        return name;
      } else {
        count++;
        name = base + '-' + count;
      }
    }
  },
  _resumePulling: function () {
    var downloading = _.filter(_.values(this.containers()), function (container) {
      return container.State.Downloading;
    });

    // Recover any pulls that were happening
    var self = this;
    downloading.forEach(function (container) {
      docker.client().pull(container.Config.Image, function (err, stream) {
        delete _placeholders[container.Name];
        localStorage.setItem('store.placeholders', JSON.stringify(_placeholders));
        stream.setEncoding('utf8');
        stream.on('data', function () {});
        stream.on('end', function () {
          self._createContainer(container.Name, {Image: container.Config.Image}, function () {
            self.emit(self.CLIENT_CONTAINER_EVENT, container.Name);
          });
        });
      });
    });
  },
  _startListeningToEvents: function () {
    docker.client().getEvents(function (err, stream) {
      if (stream) {
        stream.setEncoding('utf8');
        stream.on('data', this._dockerEvent.bind(this));
      }
    }.bind(this));
  },
  _dockerEvent: function (json) {
    var data = JSON.parse(json);
    console.log(data);

    // If the event is delete, remove the container
    if (data.status === 'destroy') {
      var container = _.findWhere(_.values(_containers), {Id: data.id});
      if (container) {
        delete _containers[container.Name];
        if (!_muted[container.Name]) {
          this.emit(this.SERVER_CONTAINER_EVENT, container.Name, data.status);
        }
      } else {
        this.emit(this.SERVER_CONTAINER_EVENT, data.status);
      }
    } else {
      this.fetchContainer(data.id, function (err) {
        if (err) {
          return;
        }
        var container = _.findWhere(_.values(_containers), {Id: data.id});
        if (!container || _muted[container.Name]) {
          return;
        }
        this.emit(this.SERVER_CONTAINER_EVENT, container ? container.Name : null, data.status);
      }.bind(this));
    }
  },
  init: function (callback) {
    // TODO: Load cached data from db on loading
    this.fetchAllContainers(function (err) {
      if (err) {
        callback(err);
        return;
      } else {
        callback();
      }
      var placeholderData = JSON.parse(localStorage.getItem('store.placeholders'));
      if (placeholderData) {
        _placeholders = _.omit(placeholderData, _.keys(_containers));
        localStorage.setItem('store.placeholders', JSON.stringify(_placeholders));
      }
      this.emit(this.CLIENT_CONTAINER_EVENT);
      this._resumePulling();
      this._startListeningToEvents();
    }.bind(this));
  },
  fetchContainer: function (id, callback) {
    docker.client().getContainer(id).inspect(function (err, container) {
      if (err) {
        callback(err);
      } else {
        if (container.Config.Image === container.Image.slice(0, 12) || container.Config.Image === container.Image) {
          callback();
          return;
        }
        // Fix leading slash in container names
        container.Name = container.Name.replace('/', '');
        _containers[container.Name] = container;
        callback(null, container);
      }
    }.bind(this));
  },
  fetchAllContainers: function (callback) {
    var self = this;
    docker.client().listContainers({all: true}, function (err, containers) {
      if (err) {
        callback(err);
        return;
      }
      var names = new Set(_.map(containers, container => container.Names[0].replace('/', '')));
      _.each(_.keys(_containers), name => {
        if (!names.has(name)) {
          delete _containers[name];
        }
      });
      async.each(containers, function (container, callback) {
        self.fetchContainer(container.Id, function (err) {
          callback(err);
        });
      }, function (err) {
        callback(err);
      });
    });
  },
  create: function (repository, tag, callback) {
    tag = tag || 'latest';
    var self = this;
    var imageName = repository + ':' + tag;
    var containerName = this._generateName(repository);

    _placeholders[containerName] = {
      Name: containerName,
      Image: imageName,
      Config: {
        Image: imageName,
      },
      State: {
        Downloading: true
      }
    };
    localStorage.setItem('store.placeholders', JSON.stringify(_placeholders));
    self.emit(self.CLIENT_CONTAINER_EVENT, containerName, 'create');

    _muted[containerName] = true;
    _progress[containerName] = 0;
    self._pullImage(repository, tag, function () {
      metrics.track('Container Finished Creating');
      delete _placeholders[containerName];
      localStorage.setItem('store.placeholders', JSON.stringify(_placeholders));
      self._createContainer(containerName, {Image: imageName}, function () {
        delete _progress[containerName];
        _muted[containerName] = false;
        self.emit(self.CLIENT_CONTAINER_EVENT, containerName);
      });
    }, function (progress) {
      _progress[containerName] = progress;
      self.emit(self.SERVER_PROGRESS_EVENT, containerName);
    });
    callback(null, containerName);
  },
  updateContainer: function (name, data, callback) {
    _muted[name] = true;
    if (!data.name) {
      data.name = data.Name;
    }
    if (name !== data.name) {
      LogStore.rename(name, data.name);
    }
    var fullData = assign(_containers[name], data);
    this._createContainer(name, fullData, function (err) {
      _muted[name] = false;
      this.emit(this.CLIENT_CONTAINER_EVENT, name);
      callback(err);
    }.bind(this));
  },
  rename: function (name, newName, callback) {
    LogStore.rename(name, newName);
    docker.client().getContainer(name).rename({name: newName}, err => {
      if (err && err.statusCode !== 204) {
        callback(err);
        return;
      }
      this.fetchAllContainers(err => {
        this.emit(this.CLIENT_CONTAINER_EVENT);
        callback(err);
      });
    });
  },
  restart: function (name, callback) {
    var container = docker.client().getContainer(name);
    container.restart(function (err) {
      callback(err);
    });
  },
  remove: function (name, callback) {
    if (_placeholders[name]) {
      delete _placeholders[name];
      return;
    }
    var container = docker.client().getContainer(name);
    if (_containers[name].State.Paused) {
      container.unpause(function (err) {
        if (err) {
          callback(err);
          return;
        } else {
          container.kill(function (err) {
            if (err) {
              callback(err);
              return;
            } else {
              container.remove(function (err) {
                if (err) {
                  callback(err);
                  return;
                }
              });
            }
          });
        }
      });
    } else {
      container.kill(function (err) {
        if (err) {
          callback(err);
          return;
        } else {
          container.remove(function (err) {
            callback(err);
          });
        }
      });
    }
  },
  containers: function() {
    return _.extend(_containers, _placeholders);
  },
  container: function (name) {
    return this.containers()[name];
  },
  sorted: function () {
    return _.values(this.containers()).sort(function (a, b) {
      if (a.State.Downloading && !b.State.Downloading) {
        return -1;
      } else if (!a.State.Downloading && b.State.Downloading) {
        return 1;
      } else {
        if (a.State.Running && !b.State.Running) {
          return -1;
        } else if (!a.State.Running && b.State.Running) {
          return 1;
        } else {
          return a.Name.localeCompare(b.Name);
        }
      }
    });
  },
  progress: function (name) {
    return _progress[name];
  },
});

module.exports = ContainerStore;
