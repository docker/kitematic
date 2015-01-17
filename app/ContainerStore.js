var EventEmitter = require('events').EventEmitter;
var async = require('async');
var assign = require('react/lib/Object.assign');
var docker = require('./docker.js');
var $ = require('jquery');

// Merge our store with Node's Event Emitter
var ContainerStore = assign(EventEmitter.prototype, {
  _containers: {},
  init: function () {
    // TODO: Load cached data from leveldb
    // Check if the pulled image is working

    // Refresh with docker & hook into events
    var self = this;
    this.update(function (err) {
      docker.client().getEvents(function (err, stream) {
        stream.setEncoding('utf8');
        stream.on('data', function (data) {
          self.update(function (err) {

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
        results.map(function (r) {
          containers[r.Id] = r;
        });
        self._containers = containers;
        self.emit('change');
        callback(null);
      });
    });
  },
  _createContainer: function (image) {
    docker.client().createContainer({
      Image: image,
      Tty: false
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
  },
  create: function (repository, tag, callback) {
    tag = tag || 'latest';
    var name = repository + ':' + tag;
    // Check if image is not local or already being downloaded
    console.log('Creating container.');
    var self = this;
    var image = docker.client().getImage(name);
    image.inspect(function (err, data) {
      /*$.get('https://registry.hub.docker.com/v1/repositories/' + repository + '/tags/' + tag, function (data) {

      });*/
      if (data === null) {
        // Pull image
        docker.client().pull(name, function (err, stream) {
          stream.setEncoding('utf8');
          stream.on('data', function (data) {
            console.log(data);
          });
          stream.on('end', function () {
            self._createContainer(name);
          });
        });

        // Create placeholder container
      } else {
        // If not then directly create the container
        self._createContainer(name);
      }
    });
      // If so then create a container w/ kitematic-only 'downloading state'
      // Pull image
      // When image is done pulling then
  },

  // Returns all shoes
  containers: function() {
    return this._containers;
  },

  addChangeListener: function(callback) {
    this.on('change', callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener('change', callback);
  }
});

module.exports = ContainerStore;
