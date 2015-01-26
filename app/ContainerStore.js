var EventEmitter = require('events').EventEmitter;
var async = require('async');
var assign = require('object-assign');
var Stream = require('stream');
var Convert = require('ansi-to-html');
var convert = new Convert();
var docker = require('./docker');
var registry = require('./registry');
var $ = require('jquery');
var _ = require('underscore');

var _recommended = [];
var _containers = {};
var _progress = {};
var _logs = {};

var ContainerStore = assign(EventEmitter.prototype, {
  CLIENT_CONTAINER_EVENT: 'client_container',
  SERVER_CONTAINER_EVENT: 'server_container',
  SERVER_PROGRESS_EVENT: 'server_progress',
  SERVER_RECOMMENDED_EVENT: 'server_recommended_event',
  SERVER_LOGS_EVENT: 'server_logs',
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
  _pullImage: function (repository, tag, callback, progressCallback) {
    registry.layers(repository, tag, function (err, layerSizes) {

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
            });

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
  _escapeHTML: function (html) {
    var text = document.createTextNode(html);
    var div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML;
  },
  _createContainer: function (image, name, callback) {
    var existing = docker.client().getContainer(name);
    var self = this;
    existing.remove(function (err, data) {
      docker.client().createContainer({
        Image: image,
        Tty: false,
        name: name,
        User: 'root'
      }, function (err, container) {
        if (err) {
          callback(err, null);
          return;
        }
        container.start({
          PublishAllPorts: true
        }, function (err) {
          if (err) {
            callback(err);
            return;
          }
          self.fetchContainer(name, callback);
        });
      });
    });
  },
  rename: function (name, newName, callback) {
    var existing = docker.client().getContainer(name);
    var existingImage = existing.Image;
    var self = this;
    existing.remove(function (err, data) {
      docker.client().createContainer({
        Image: existingImage,
        Tty: false,
        name: newName,
        User: 'root'
      }, function (err, container) {
        if (err) {
          callback(err, null);
          return;
        }
        container.start({
          PublishAllPorts: true
        }, function (err) {
          if (err) {
            callback(err);
            return;
          }
          self.fetchContainer(newName, callback);
        });
      });
    });
  },
  remove: function (name, callback) {
    var existing = docker.client().getContainer(name);
    existing.kill(function (err) {
      if (err) {
        console.log(err);
      } else {
        existing.remove(function (err) {
          if (err) {
            console.log(err);
          }
        });
      }
    });
  },
  _createPlaceholderContainer: function (imageName, name, callback) {
    var self = this;
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
        if (err) {
          callback(err);
          return;
        }
        self.fetchContainer(name, callback);
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
    var downloading = _.filter(_.values(_containers), function (container) {
      return container.State.Downloading;
    });

    // Recover any pulls that were happening
    var self = this;
    downloading.forEach(function (container) {
      docker.client().pull(container.KitematicDownloadingImage, function (err, stream) {
        stream.setEncoding('utf8');
        stream.on('data', function (data) {});
        stream.on('end', function () {
          self._createContainer(container.KitematicDownloadingImage, container.Name, function () {});
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
      delete _containers[container.Name];
      this.emit(this.SERVER_CONTAINER_EVENT, container.Name, data.status);
    } else {
      this.fetchContainer(data.id, function (err) {
        var container = _.findWhere(_.values(_containers), {Id: data.id});
        this.emit(this.SERVER_CONTAINER_EVENT, container ? container.Name : null, data.status);
      }.bind(this));
    }
  },
  init: function (callback) {
    // TODO: Load cached data from db on loading
    this.fetchAllContainers(function (err) {
      callback();
      this.emit(this.CLIENT_CONTAINER_EVENT);
      this.fetchRecommended(function (err) {
        this.emit(this.SERVER_RECOMMENDED_EVENT);
      }.bind(this));
      this._resumePulling();
      this._startListeningToEvents();
    }.bind(this));
  },
  fetchContainer: function (id, callback) {
    docker.client().getContainer(id).inspect(function (err, container) {
      if (err) {
        callback(err);
      } else {
        // Fix leading slash in container names
        container.Name = container.Name.replace('/', '');

        // Add Downloading State (stored in environment variables) to containers for Kitematic
        var env = _.object(container.Config.Env.map(function (e) { return e.split('='); }));
        container.State.Downloading = !!env.KITEMATIC_DOWNLOADING;
        container.KitematicDownloadingImage = env.KITEMATIC_DOWNLOADING_IMAGE;

        _containers[container.Name] = container;
        callback(null, container);
      }
    });
  },
  fetchAllContainers: function (callback) {
    var self = this;
    docker.client().listContainers({all: true}, function (err, containers) {
      if (err) {
        callback(err);
        return;
      }
      async.map(containers, function (container, callback) {
        self.fetchContainer(container.Id, function (err) {
          callback(err);
        });
      }, function (err, results) {
        callback(err);
      });
    });
  },
  fetchRecommended: function (callback) {
    if (_recommended.length) {
     return;
   }
    var self = this;
    $.ajax({
      url: 'https://kitematic.com/recommended.json',
      dataType: 'json',
      success: function (res, status) {
        var recommended = res.recommended;
        async.map(recommended, function (repository, callback) {
          $.get('https://registry.hub.docker.com/v1/search?q=' + repository, function (data) {
            var results = data.results;
            callback(null, _.find(results, function (r) {
              return r.name === repository;
            }));
          });
        }, function (err, results) {
          _recommended = results;
          callback();
        });
      },
      error: function (err) {
        console.log(err);
      }
    });
  },
  fetchLogs: function (name, callback) {
    if (_logs[name]) {
      callback();
    }
    _logs[name] = [];
    var index = 0;
    var self = this;
    docker.client().getContainer(name).logs({
      follow: false,
      stdout: true,
      stderr: true,
      timestamps: true
    }, function (err, stream) {
      stream.setEncoding('utf8');
      stream.on('data', function (buf) {
        // Every other message is a header
        if (index % 2 === 1) {
          var time = buf.substr(0,buf.indexOf(' '));
          var msg = buf.substr(buf.indexOf(' ')+1);
          _logs[name].push(convert.toHtml(self._escapeHTML(msg)));
          self.emit(self.SERVER_LOGS_EVENT, name);
        }
        index += 1;
      });
      stream.on('end', function (buf) {
        callback();
        docker.client().getContainer(name).logs({
          follow: true,
          stdout: true,
          stderr: true,
          timestamps: true,
          tail: 0
        }, function (err, stream) {
          stream.setEncoding('utf8');
          stream.on('data', function (buf) {
            // Every other message is a header
            if (index % 2 === 1) {
              var time = buf.substr(0,buf.indexOf(' '));
              var msg = buf.substr(buf.indexOf(' ')+1);
              _logs[name].push(convert.toHtml(self._escapeHTML(msg)));
              self.emit(self.SERVER_LOGS_EVENT, name);
            }
            index += 1;
          });
        });
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
          _containers[containerName] = container;
          self.emit(self.CLIENT_CONTAINER_EVENT, containerName, 'create');
          _progress[containerName] = 0;
          self._pullImage(repository, tag, function () {
            self._createContainer(imageName, containerName, function (err, container) {
              delete _progress[containerName];
            });
          }, function (progress) {
            _progress[containerName] = progress;
            self.emit(self.SERVER_PROGRESS_EVENT, containerName);
          });
          callback(null, containerName);
        });
      } else {
        // If not then directly create the container
        self._createContainer(imageName, containerName, function (err, container) {
          self.emit(ContainerStore.CLIENT_CONTAINER_EVENT, containerName, 'create');
          callback(null, containerName);
        });
      }
    });
  },
  containers: function() {
    return _containers;
  },
  container: function (name) {
    return _containers[name];
  },
  sorted: function () {
    return _.values(_containers).sort(function (a, b) {
      var active = function (container) {
        return container.State.Running || container.State.Restarting || container.State.Downloading;
      };
      if (active(a) && !active(b)) {
        return -1;
      } else if (!active(a) && active(b)) {
        return 1;
      } else {
        return a.Name.localeCompare(b.Name);
      }
    });
  },
  recommended: function () {
    return _recommended;
  },
  progress: function (name) {
    return _progress[name];
  },
  logs: function (name) {
    return _logs[name] || [];
  }
});

module.exports = ContainerStore;
