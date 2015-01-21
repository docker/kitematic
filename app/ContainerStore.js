var EventEmitter = require('events').EventEmitter;
var async = require('async');
var assign = require('react/lib/Object.assign');
var docker = require('./docker');
var registry = require('./registry');
var $ = require('jquery');
var _ = require('underscore');

// Merge our store with Node's Event Emitter
var ContainerStore = assign(EventEmitter.prototype, {
  CONTAINERS: 'containers',
  PROGRESS: 'progress',
  LOGS: 'logs',
  ACTIVE: 'active',
  _containers: {},
  _progress: {},
  _logs: {},
  _active: null,
  _pullScratchImage: function (callback) {
    var image = docker.client().getImage('scratch:latest');
    image.inspect(function (err, data) {
      if (!data) {
        docker.client().pull('scratch:latest', function (err, stream) {
          if (err) {
            callback(err);
            return;
          }
          stream.setEncoding('utf8');
          stream.on('data', function (data) {});
          stream.on('end', function () {
            callback();
          });
        });
      } else {
        callback();
      }
    });
  },
  _createContainer: function (image, name, callback) {
    var existing = docker.client().getContainer(name);
    existing.remove(function (err, data) {
      console.log('Placeholder removed.');
      docker.client().createContainer({
        Image: image,
        Tty: false,
        name: name
      }, function (err, container) {
        if (err) {
          callback(err, null);
          return;
        }
        console.log('Created container: ' + container.id);
        container.start({
          PublishAllPorts: true
        }, function (err) {
          if (err) { callback(err, null); return; }
          console.log('Started container: ' + container.id);
          callback(null, container);
        });
      });
    });
  },
  _createPlaceholderContainer: function (imageName, name, callback) {
    console.log('_createPlaceholderContainer', imageName, name);
    this._pullScratchImage(function (err) {
      if (err) {
        callback(err);
        return;
      }
      docker.client().createContainer({
        Image: 'scratch:latest',
        Tty: false,
        Env: [
          'KITEMATIC_DOWNLOADING=true',
          'KITEMATIC_DOWNLOADING_IMAGE=' + imageName
        ],
        Cmd: 'placeholder',
        name: name
      }, function (err, container) {
        callback(err, container);
      });
    });
  },
  _generateName: function (repository) {
    var base = _.last(repository.split('/'));
    var count = 1;
    var name = base;
    while (true) {
      var exists = _.findWhere(_.values(this._containers), {Name: '/' + name}) || _.findWhere(_.values(this._containers), {Name: name});
      if (!exists) {
        return name;
      } else {
        count++;
        name = base + '-' + count;
      }
    }
  },
  init: function (callback) {
    // TODO: Load cached data from db on loading

    // Refresh with docker & hook into events
    var self = this;
    this.update(function (err) {
      callback();
      var downloading = _.filter(_.values(self._containers), function (container) {
        var env = container.Config.Env;
        return _.indexOf(env, 'KITEMATIC_DOWNLOADING=true') !== -1;
      });

      // Recover any pulls that were happening
      downloading.forEach(function (container) {
        var env = _.object(container.Config.Env.map(function (e) {
          return e.split('=');
        }));
        docker.client().pull(env.KITEMATIC_DOWNLOADING_IMAGE, function (err, stream) {
          stream.setEncoding('utf8');
          stream.on('data', function (data) {
            console.log(data);
          });
          stream.on('end', function () {
            self._createContainer(env.KITEMATIC_DOWNLOADING_IMAGE, container.Name.replace('/', ''), function () {

            });
          });
        });
      });

      docker.client().getEvents(function (err, stream) {
        stream.setEncoding('utf8');
        stream.on('data', function (data) {
          console.log(data);

          // TODO: Dont refresh on deleting placeholder containers
          var deletingPlaceholder = data.status === 'destroy' && self.container(data.id) && self.container(data.id).Config.Env.indexOf('KITEMATIC_DOWNLOADING=true') !== -1;
          console.log(deletingPlaceholder);
          if (!deletingPlaceholder) {
            self.update(function (err) {
              console.log('Updated container data.');
            });
          }
        });
      });
    });
  },
  update: function (callback) {
    var self = this;
    docker.client().listContainers({all: true}, function (err, containers) {
      if (err) {
        callback(err);
        return;
      }
      async.map(containers, function(container, callback) {
        docker.client().getContainer(container.Id).inspect(function (err, data) {
          callback(err, data);
        });
      }, function (err, results) {
        if (err) {
          callback(err);
          return;
        }
        var containers = {};
        results.forEach(function (r) {
          containers[r.Name.replace('/', '')] = r;
        });
        self._containers = containers;
        self.emit(self.CONTAINERS);
        callback(null);
      });
    });
  },
  create: function (repository, tag, callback) {
    tag = tag || 'latest';
    var self = this;
    var imageName = repository + ':' + tag;
    var containerName = this._generateName(repository);
    var image = docker.client().getImage(imageName);

    image.inspect(function (err, data) {
      if (!data) {
        // Pull image
        self._createPlaceholderContainer(imageName, containerName, function (err, container) {
          if (err) {
            console.log(err);
          }
          registry.layers(repository, tag, function (err, layerSizes) {
            if (err) {
              callback(err);
            }

            // TODO: Support v2 registry API
            // TODO: clean this up- It's messy to work with pulls from both the v1 and v2 registry APIs
            // Use the per-layer pull progress % to update the total progress.
            docker.client().listImages({all: 1}, function(err, images) {
              var existingIds = new Set(images.map(function (image) {
                return image.Id.slice(0, 12);
              }));
              var layersToDownload = layerSizes.filter(function (layerSize) {
                return !existingIds.has(layerSize.Id);
              });

              var totalBytes = layersToDownload.map(function (s) { return s.size; }).reduce(function (pv, sv) { return pv + sv; }, 0);
              docker.client().pull(imageName, function (err, stream) {
                callback(null, containerName);
                stream.setEncoding('utf8');

                var layerProgress = layersToDownload.reduce(function (r, layer) {
                  if (_.findWhere(images, {Id: layer.Id})) {
                    r[layer.Id] = 100;
                  } else {
                    r[layer.Id] = 0;
                  }
                  return r;
                }, {});

                self._progress[containerName] = 0;
                self.emit(containerName);

                stream.on('data', function (str) {
                  console.log(str);
                  var data = JSON.parse(str);

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
                  });

                  var totalProgress = totalReceived / totalBytes;
                  self._progress[containerName] = totalProgress;
                  self.emit(self.PROGRESS);
                });
                stream.on('end', function () {
                  self._createContainer(imageName, containerName, function () {
                    delete self._progress[containerName];
                  });
                });
              });
            });
          });
        });
      } else {
        // If not then directly create the container
        self._createContainer(imageName, containerName, function () {
          callback(null, containerName);
          console.log('done');
        });
      }
    });
  },
  setActive: function (name) {
    console.log('set active');
    this._active = name;
    this.emit(this.ACTIVE);
  },
  active: function () {
    return this._active;
  },
  // Returns all containers
  containers: function() {
    return this._containers;
  },
  container: function (name) {
    return this._containers[name];
  },
  progress: function (name) {
    return this._progress[name];
  },
  logs: function (name) {
    return logs[name];
  },
  addChangeListener: function(eventType, callback) {
    this.on(eventType, callback);
  },
  removeChangeListener: function(eventType, callback) {
    this.removeListener(eventType, callback);
  },
});

module.exports = ContainerStore;
