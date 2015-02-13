var $ = require('jquery');
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var path = require('path');
var assign = require('object-assign');
var Convert = require('ansi-to-html');
var docker = require('./Docker');
var registry = require('./Registry');
var ContainerUtil = require('./ContainerUtil');

var convert = new Convert();
var _recommended = [];
var _containers = {};
var _progress = {};
var _logs = {};
var _streams = {};
var _muted = {};

var ContainerStore = assign(Object.create(EventEmitter.prototype), {
  CLIENT_CONTAINER_EVENT: 'client_container_event',
  CLIENT_RECOMMENDED_EVENT: 'client_recommended_event',
  SERVER_CONTAINER_EVENT: 'server_container_event',
  SERVER_PROGRESS_EVENT: 'server_progress_event',
  SERVER_LOGS_EVENT: 'server_logs_event',
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
          stream.on('data', function () {});
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
    existing.kill(function (err) {
      if (err) {
        console.log(err);
      }
      existing.remove(function (err) {
        if (err) {
          console.log(err);
        }
        docker.client().getImage(containerData.Image).inspect(function (err, data) {
          if (err) {
            callback(err);
            return;
          }
          var binds = [];
          if (data.Config.Volumes) {
            _.each(data.Config.Volumes, function (value, key) {
              binds.push(path.join(process.env.HOME, 'Kitematic', containerData.name, key)+ ':' + key);
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
      }, function (err) {
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
        stream.on('data', function () {});
        stream.on('end', function () {
          self._createContainer(container.Name, {Image: container.KitematicDownloadingImage}, function () {});
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
      this.emit(this.CLIENT_CONTAINER_EVENT);
      this._resumePulling();
      this._startListeningToEvents();
    }.bind(this));
    this.fetchRecommended(function () {
      this.emit(this.CLIENT_RECOMMENDED_EVENT);
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

        // Add Downloading State (stored in environment variables) to containers for Kitematic
        var env = ContainerUtil.env(container);
        container.State.Downloading = !!env.KITEMATIC_DOWNLOADING;
        container.KitematicDownloadingImage = env.KITEMATIC_DOWNLOADING_IMAGE;

        this.fetchLogs(container.Name, function () {
        }.bind(this));

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
      async.map(containers, function (container, callback) {
        self.fetchContainer(container.Id, function (err) {
          callback(err);
        });
      }, function (err) {
        callback(err);
      });
    });
  },
  fetchRecommended: function (callback) {
    if (_recommended.length) {
     return;
   }
    $.ajax({
      url: 'https://kitematic.com/recommended.json',
      cache: false,
      dataType: 'json',
      success: function (res) {
        var recommended = res.repos;
        async.map(recommended, function (rec, callback) {
          $.get('https://registry.hub.docker.com/v1/search?q=' + rec.repo, function (data) {
            var results = data.results;
            var result = _.find(results, function (r) {
              return r.name === rec.repo;
            });
            callback(null, _.extend(result, rec));
          });
        }, function (err, results) {
          _recommended = results.filter(function(r) { return !!r; });
          callback();
        });
      },
      error: function (err) {
        console.log(err);
      }
    });
  },
  fetchLogs: function (name, callback) {
    var index = 0;
    var self = this;
    docker.client().getContainer(name).logs({
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: true
    }, function (err, stream) {
      callback(err);
      if (_streams[name]) {
        return;
      }
      _streams[name] = stream;
      if (err) {
        return;
      }
      _logs[name] = [];
      stream.setEncoding('utf8');
      var timeout;
      stream.on('data', function (buf) {
        // Every other message is a header
        if (index % 2 === 1) {
          //var time = buf.substr(0,buf.indexOf(' '));
          var msg = buf.substr(buf.indexOf(' ')+1);
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          timeout = setTimeout(function () {
            timeout = null;
            self.emit(self.SERVER_LOGS_EVENT, name);
          }, 100);
          _logs[name].push(convert.toHtml(self._escapeHTML(msg)));
        }
        index += 1;
      });
      stream.on('end', function () {
        delete _streams[name];
      });
    });
  },
  create: function (repository, tag, callback) {
    tag = tag || 'latest';
    var self = this;
    var imageName = repository + ':' + tag;
    var containerName = this._generateName(repository);
    // Pull image
    self._createPlaceholderContainer(imageName, containerName, function (err, container) {
      if (err) {
        callback(err);
        return;
      }
      _containers[containerName] = container;
      self.emit(self.CLIENT_CONTAINER_EVENT, containerName, 'create');
      _muted[containerName] = true;
      _progress[containerName] = 0;
      self._pullImage(repository, tag, function () {
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
    });
  },
  updateContainer: function (name, data, callback) {
    _muted[name] = true;
    if (!data.name) {
      data.name = data.Name;
    }
    var fullData = assign(_containers[name], data);
    this._createContainer(name, fullData, function (err) {
      _muted[name] = false;
      this.emit(this.CLIENT_CONTAINER_EVENT, name);
      callback(err);
    }.bind(this));
  },
  restart: function (name, callback) {
    var container = docker.client().getContainer(name);
    container.restart(function (err) {
      callback(err);
    });
  },
  remove: function (name, callback) {
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
    return _containers;
  },
  container: function (name) {
    return _containers[name];
  },
  sorted: function () {
    return _.values(_containers).sort(function (a, b) {
      return a.Name.localeCompare(b.Name);
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
