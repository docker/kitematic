var EventEmitter = require('events').EventEmitter;
var async = require('async');
var assign = require('react/lib/Object.assign');
var docker = require('./docker.js');
var $ = require('jquery');
var _ = require('underscore');

// Merge our store with Node's Event Emitter
var ContainerStore = assign(EventEmitter.prototype, {
  CONTAINERS: 'containers',
  ACTIVE: 'active',
  _containers: {},
  _logs: {},
  _active: null,
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
              console.log('RECOVERED');
            });
          });
        });
      });

      docker.client().getEvents(function (err, stream) {
        stream.setEncoding('utf8');
        stream.on('data', function (data) {
          console.log(data);

          // TODO: Dont refresh on deleting placeholder containers
          self.update(function (err) {
            console.log('Updated container data.');
          });
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
        _.keys(self._containers).forEach(function(c) {
          self.emit(c);
        });
        self.emit(self.CONTAINERS);
        callback(null);
      });
    });
  },
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
  // Returns all containers
  containers: function() {
    return this._containers;
  },
  create: function (repository, tag, callback) {
    var containerName = this._generateName(repository);
    tag = tag || 'latest';
    var imageName = repository + ':' + tag;
    // Check if image is not local or already being downloaded
    console.log('Creating container.');
    var self = this;
    var image = docker.client().getImage(imageName);
    console.log(image);
    image.inspect(function (err, data) {
      // TODO: Get image size from registry API
      /*$.get('https://registry.hub.docker.com/v1/repositories/' + repository + '/tags/' + tag, function (data) {

      });*/
      if (!data) {
        // Pull image
        self._createPlaceholderContainer(imageName, containerName, function (err, container) {
          if (err) {
            console.log(err);
          }
          console.log('Placeholder container created.');
          docker.client().pull(imageName, function (err, stream) {
            console.log(containerName);
            callback(null, containerName);
            stream.setEncoding('utf8');
            stream.on('data', function (data) {
              // TODO: update progress
              //console.log(data);
            });
            stream.on('end', function () {
              self._createContainer(imageName, containerName, function () {
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
      // If so then create a container w/ kitematic-only 'downloading state'
      // Pull image
      // When image is done pulling then
  },
  setActive: function (containerName) {
    this._active = containerName;
    this.emit(self.ACTIVE);
  },
  active: function () {
    return this._active;
  },
  logs: function (containerName) {
    return logs[containerId];
  },
  addChangeListener: function(eventType, callback) {
    this.on(eventType, callback);
  },
  removeChangeListener: function(eventType, callback) {
    this.removeListener(eventType, callback);
  },
});

module.exports = ContainerStore;
