var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var assign = require('object-assign');
var docker = require('../utils/DockerUtil');
var metrics = require('../utils/MetricsUtil');
var registry = require('../utils/RegistryUtil');
var logStore = require('../stores/LogStore');
var bugsnag = require('bugsnag-js');

var _placeholders = {};
var _containers = {};
var _progress = {};
var _muted = {};
var _blocked = {};
var _error = null;
var _pending = null;

var ContainerStore = assign(Object.create(EventEmitter.prototype), {
  CLIENT_CONTAINER_EVENT: 'client_container_event',
  SERVER_CONTAINER_EVENT: 'server_container_event',
  SERVER_PROGRESS_EVENT: 'server_progress_event',
  SERVER_ERROR_EVENT: 'server_error_event',
  _pullImage: function (repository, tag, callback, progressCallback, blockedCallback) {
    registry.layers(repository, tag, (err, layerSizes) => {

      // TODO: Support v2 registry API
      // TODO: clean this up- It's messy to work with pulls from both the v1 and v2 registry APIs
      // Use the per-layer pull progress % to update the total progress.
      docker.client().listImages({all: 1}, (err, images) => {
        images = images || [];
        var existingIds = new Set(images.map(function (image) {
          return image.Id.slice(0, 12);
        }));
        var layersToDownload = layerSizes.filter(function (layerSize) {
          return !existingIds.has(layerSize.Id) && !isNaN(layerSize.size);
        });

        var totalBytes = layersToDownload.map(function (s) { return s.size; }).reduce(function (pv, sv) { return pv + sv; }, 0);
        docker.client().pull(repository + ':' + tag, (err, stream) => {
          if (err) {
            callback(err);
            return;
          }
          stream.setEncoding('utf8');

          var layerProgress = layersToDownload.reduce(function (r, layer) {
            if (_.findWhere(images, {Id: layer.Id})) {
              r[layer.Id] = 100;
            } else {
              r[layer.Id] = 0;
            }
            return r;
          }, {});

          stream.on('data', str => {
            var data = JSON.parse(str);

            if (data.error) {
              _error = data.error;
              callback(data.error);
              return;
            }

            if (data.status && (data.status === 'Pulling dependent layers' || data.status.indexOf('already being pulled by another client') !== -1)) {
              blockedCallback();
              return;
            }

            if (data.status === 'Already exists') {
              layerProgress[data.id] = 1;
            } else if (data.status === 'Downloading') {
              var current = data.progressDetail.current;
              var total = data.progressDetail.total;
              if (total <= 0) {
                progressCallback(0);
                return;
              } else {
                layerProgress[data.id] = current / total;
              }

              var chunks = layersToDownload.map(function (s) {
                var progress = layerProgress[s.Id] || 0;
                return progress * s.size;
              });

              var totalReceived = chunks.reduce(function (pv, sv) {
                return pv + sv;
              }, 0);

              var totalProgress = totalReceived / totalBytes;
              progressCallback(totalProgress);
            }
          });
          stream.on('end', function () {
            callback(_error);
            _error = null;
          });
        });
      });
    });
  },
  _startContainer: function (name, containerData, callback) {
    var self = this;
    var binds = containerData.Binds || [];
    var startopts = {
      Binds: binds
    };
    if (containerData.NetworkSettings && containerData.NetworkSettings.Ports) {
      startopts.PortBindings = containerData.NetworkSettings.Ports;
    } else{
      startopts.PublishAllPorts = true;
    }
    var container = docker.client().getContainer(name);
    container.start(startopts, function (err) {
      if (err) {
        callback(err);
        return;
      }
      self.fetchContainer(name, callback);
      logStore.fetch(name);
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
    if (!containerData.Env && containerData.Config && containerData.Config.Env) {
      containerData.Env = containerData.Config.Env;
    }
    existing.kill(function () {
      existing.remove(function () {
        docker.client().createContainer(containerData, function (err) {
          if (err) {
            callback(err, null);
            return;
          }
          self._startContainer(name, containerData, callback);
        });
      });
    });
  },
  _generateName: function (repository) {
    var base = _.last(repository.split('/'));
    var count = 1;
    var name = base;
    while (true) {
      if (!this.containers()[name]) {
        return name;
      } else {
        count++;
        name = base + '-' + count;
      }
    }
  },
  _resumePulling: function (callback) {
    var downloading = _.filter(_.values(this.containers()), function (container) {
      return container.State.Downloading;
    });

    // Recover any pulls that were happening
    var self = this;
    downloading.forEach(function (container) {
      _progress[container.Name] = 99;
      docker.client().pull(container.Config.Image, function (err, stream) {
        if (err) {
          callback(err);
          return;
        }
        stream.setEncoding('utf8');
        stream.on('data', function () {});
        stream.on('end', function () {
          delete _placeholders[container.Name];
          delete _progress[container.Name];
          localStorage.setItem('store.placeholders', JSON.stringify(_placeholders));
          self._createContainer(container.Name, {Image: container.Config.Image}, err => {
            if (err) {
              callback(err);
              return;
            }
            self.emit(self.SERVER_PROGRESS_EVENT, container.Name);
            self.emit(self.CLIENT_CONTAINER_EVENT, container.Name);
          });
        });
      });
    });
  },
  _startListeningToEvents: function (callback) {
    docker.client().getEvents((err, stream) => {
      if (err) {
        callback(err);
        return;
      }
      if (stream) {
        stream.setEncoding('utf8');
        stream.on('data', this._dockerEvent.bind(this));
      }
    });
  },
  _dockerEvent: function (json) {
    var data = JSON.parse(json);
    console.log(data);

    if (data.status === 'pull' || data.status === 'untag' || data.status === 'delete') {
      return;
    }

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
      this.fetchContainer(data.id, err => {
        if (err) {
          return;
        }
        var container = _.findWhere(_.values(_containers), {Id: data.id});
        if (!container || _muted[container.Name]) {
          return;
        }
        this.emit(this.SERVER_CONTAINER_EVENT, container ? container.Name : null, data.status);
      });
    }
  },
  init: function (callback) {
    this.fetchAllContainers(err => {
      if (err) {
        _error = err;
        this.emit(this.SERVER_ERROR_EVENT, err);
        bugsnag.notify(err, 'Container Store failed to init', err);
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
      this._resumePulling(err => {
        _error = err;
        this.emit(this.SERVER_ERROR_EVENT, err);
        bugsnag.notify(err, 'Container Store failed to resume pulling', err);
      });
      this._startListeningToEvents(err => {
        _error = err;
        this.emit(this.SERVER_ERROR_EVENT, err);
        bugsnag.notify(err, 'Container Store failed to listen to events', err);
      });
    });
  },
  fetchContainer: function (id, callback) {
    docker.client().getContainer(id).inspect((err, container) => {
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
    });
  },
  fetchAllContainers: function (callback) {
    docker.client().listContainers({all: true}, (err, containers) => {
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
      async.each(containers, (container, callback) => {
        this.fetchContainer(container.Id, function (err) {
          callback(err);
        });
      }, function (err) {
        callback(err);
      });
    });
  },
  create: function (repository, tag, callback) {
    tag = tag || 'latest';
    var imageName = repository + ':' + tag;
    var containerName = this._generateName(repository);

    _placeholders[containerName] = {
      Id: require('crypto').randomBytes(32).toString('hex'),
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
    this.emit(this.CLIENT_CONTAINER_EVENT, containerName, 'create');

    _muted[containerName] = true;
    this._pullImage(repository, tag, err => {
      if (err) {
        _error = err;
        this.emit(this.SERVER_ERROR_EVENT, err);
        bugsnag.notify(err, 'Container Store failed to create container', err);
        return;
      }
      _error = null;
      _blocked[containerName] = false;
      if (!_placeholders[containerName]) {
        return;
      }
      delete _placeholders[containerName];
      localStorage.setItem('store.placeholders', JSON.stringify(_placeholders));
      this._createContainer(containerName, {Image: imageName}, err => {
        if (err) {
          console.log(err);
          _error = err;
          this.emit(this.SERVER_ERROR_EVENT, err);
          return;
        }
        _error = null;
        metrics.track('Container Finished Creating');
        delete _progress[containerName];
        _muted[containerName] = false;
        this.emit(this.CLIENT_CONTAINER_EVENT, containerName);
      });
    }, progress => {
      _blocked[containerName] = false;
      _progress[containerName] = progress;
      this.emit(this.SERVER_PROGRESS_EVENT, containerName);
    }, () => {
      _blocked[containerName] = true;
      this.emit(this.SERVER_PROGRESS_EVENT, containerName);
    });
    callback(null, containerName);
  },
  updateContainer: function (name, data, callback) {
    _muted[name] = true;
    if (!data.name) {
      data.name = data.Name;
    }
    var fullData = assign(_containers[name], data);
    this._createContainer(name, fullData, function () {
      _muted[name] = false;
      this.emit(this.CLIENT_CONTAINER_EVENT, name);
      callback();
    }.bind(this));
  },
  rename: function (name, newName, callback) {
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
    _muted[name] = true;
    container.stop(err => {
      if (err && err.statusCode !== 304) {
        _muted[name] = false;
        callback(err);
      } else {
        var data = _containers[name];
        this._startContainer(name, data, err => {
          _muted[name] = false;
          this.emit(this.CLIENT_CONTAINER_EVENT, name, 'start');
          callback(err);
        });
      }
    });
  },
  stop: function (name, callback) {
    var container = docker.client().getContainer(name);
    _muted[name] = true;
    container.stop(err => {
      if (err && err.statusCode !== 304) {
        _muted[name] = false;
        callback(err);
      } else {
        _muted[name] = false;
        this.fetchContainer(name, callback);
      }
    });
  },
  start: function (name, callback) {
    var container = docker.client().getContainer(name);
    container.start(err => {
      if (err && err.statusCode !== 304) {
        callback(err);
      } else {
        this.fetchContainer(name, callback);
      }
    });
  },
  remove: function (name, callback) {
    if (_placeholders[name]) {
      delete _placeholders[name];
      localStorage.setItem('store.placeholders', JSON.stringify(_placeholders));
      this.emit(this.CLIENT_CONTAINER_EVENT, name, 'destroy');
      callback();
      return;
    }
    var container = docker.client().getContainer(name);
    if (_containers[name] && _containers[name].State.Paused) {
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
    return _.extend(_.clone(_containers), _placeholders);
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
  blocked: function (name) {
    return !!_blocked[name];
  },
  error: function () {
    return _error;
  },
  downloading: function () {
    return !!_.keys(_placeholders).length;
  },
  pending: function () {
    return _pending;
  },
  setPending: function (repository, tag) {
    _pending = {
      repository: repository,
      tag: tag
    };
    this.emit(this.CLIENT_CONTAINER_EVENT, null, 'pending');
  },
  clearPending: function () {
    _pending = null;
    this.emit(this.CLIENT_CONTAINER_EVENT, null, 'pending');
  }
});

module.exports = ContainerStore;
