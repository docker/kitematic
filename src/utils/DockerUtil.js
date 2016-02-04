import async from 'async';
import fs from 'fs';
import path from 'path';
import dockerode from 'dockerode';
import _ from 'underscore';
import child_process from 'child_process';
import util from './Util';
import hubUtil from './HubUtil';
import metrics from '../utils/MetricsUtil';
import containerServerActions from '../actions/ContainerServerActions';
import rimraf from 'rimraf';
import stream from 'stream';
import Promise from 'bluebird';
import JSONStream from 'JSONStream';

export default {
  host: null,
  client: null,
  placeholders: {},
  streams: {},
  activeContainerName: null,

  setup (ip, name) {
    if (!ip || !name) {
      throw new Error('Falsy ip or name passed to docker client setup');
    }

    if (util.isLinux()) {
      this.host = 'localhost';
      this.client = new dockerode({socketPath: '/var/run/docker.sock'});
    } else {
      let certDir = path.join(util.home(), '.docker/machine/machines/', name);
      if (!fs.existsSync(certDir)) {
        throw new Error('Certificate directory does not exist');
      }

      this.host = ip;
      this.client = new dockerode({
        protocol: 'https',
        host: ip,
        port: 2376,
        ca: fs.readFileSync(path.join(certDir, 'ca.pem')),
        cert: fs.readFileSync(path.join(certDir, 'cert.pem')),
        key: fs.readFileSync(path.join(certDir, 'key.pem'))
      });
    }
  },

  async version () {
    let version = null;
    let maxRetries = 10;
    let retries = 0;
    let error_message = "";
    while (version == null && retries < maxRetries) {
      console.log('Trying to fetch docker verion, tries : ' + retries);
      this.client.version((error,data) => {
        if (!error) {
          version = data.Version;
        } else {
          error_message = error;
        }
        retries++;
      });
      await Promise.delay(1000);
    }
    if (version == null) {
       throw new Error(error_message);
    }
    return version;
  },
  init () {
    this.placeholders = JSON.parse(localStorage.getItem('placeholders')) || {};
    this.fetchAllContainers();
    this.listen();

    // Resume pulling containers that were previously being pulled
    _.each(_.values(this.placeholders), container => {
      containerServerActions.added({container});

      this.client.pull(container.Config.Image, (error, stream) => {
        if (error) {
          containerServerActions.error({name: container.Name, error});
          return;
        }

        stream.setEncoding('utf8');
        stream.on('data', function () {});
        stream.on('end', () => {
          if (!this.placeholders[container.Name]) {
            return;
          }

          delete this.placeholders[container.Name];
          localStorage.setItem('placeholders', JSON.stringify(this.placeholders));
          this.createContainer(container.Name, {Image: container.Config.Image});
        });
      });
    });
  },

  isDockerRunning () {
    try {
      child_process.execSync('ps ax | grep "docker daemon" | grep -v grep');
    } catch (error) {
      throw new Error('Cannot connect to the Docker daemon. The daemon is not running.');
    }
  },

  startContainer (name) {
    let container = this.client.getContainer(name);
    container.start((error) => {
      if (error) {
        containerServerActions.error({name, error});
        return;
      }
      containerServerActions.started({name, error});
      this.fetchContainer(name);
    });
  },

  createContainer (name, containerData) {
    containerData.name = containerData.Name || name;

    if (containerData.Config && containerData.Config.Image) {
      containerData.Image = containerData.Config.Image;
    }

    if (!containerData.Env && containerData.Config && containerData.Config.Env) {
      containerData.Env = containerData.Config.Env;
    }

    containerData.Volumes = _.mapObject(containerData.Volumes, () => {});

    this.client.getImage(containerData.Image).inspect((error, image) => {
      if (error) {
        containerServerActions.error({name, error});
        return;
      }

      if (!containerData.HostConfig || (containerData.HostConfig && !containerData.HostConfig.PortBindings)) {
        containerData.PublishAllPorts = true;
      }

      if (image.Config.Cmd) {
        containerData.Cmd = image.Config.Cmd;
      } else if (!image.Config.Entrypoint) {
        containerData.Cmd = 'bash';
      }

      let existing = this.client.getContainer(name);
      existing.kill(() => {
        existing.remove(() => {
          this.client.createContainer(containerData, (error) => {
            if (error) {
              containerServerActions.error({name, error});
              return;
            }
            metrics.track('Container Finished Creating');
            this.startContainer(name);
            delete this.placeholders[name];
            localStorage.setItem('placeholders', JSON.stringify(this.placeholders));
          });
        });
      });
    });
  },

  fetchContainer (id) {
    this.client.getContainer(id).inspect((error, container) => {
      if (error) {
        containerServerActions.error({name: id, error});
      } else {
        container.Name = container.Name.replace('/', '');
        containerServerActions.updated({container});
      }
    });
  },

  fetchAllContainers () {
    this.client.listContainers({all: true}, (err, containers) => {
      if (err) {
        return;
      }
      async.map(containers, (container, callback) => {
        this.client.getContainer(container.Id).inspect((error, container) => {
          if (error) {
            callback(null, null);
            return;
          }
          container.Name = container.Name.replace('/', '');
          callback(null, container);
        });
      }, (err, containers) => {
        containers = containers.filter(c => c !== null);
        if (err) {
          // TODO: add a global error handler for this
          return;
        }
        containerServerActions.allUpdated({containers: _.indexBy(containers.concat(_.values(this.placeholders)), 'Name')});
      });
    });
  },

  run (name, repository, tag) {
    tag = tag || 'latest';
    let imageName = repository + ':' + tag;

    let placeholderData = {
      Id: util.randomId(),
      Name: name,
      Image: imageName,
      Config: {
        Image: imageName
      },
      Tty: true,
      OpenStdin: true,
      State: {
        Downloading: true
      }
    };
    containerServerActions.added({container: placeholderData});

    this.placeholders[name] = placeholderData;
    localStorage.setItem('placeholders', JSON.stringify(this.placeholders));

    this.pullImage(repository, tag, error => {
      if (error) {
        containerServerActions.error({name, error});
        return;
      }

      if (!this.placeholders[name]) {
        return;
      }

      this.createContainer(name, {Image: imageName, Tty: true, OpenStdin: true});
    },

    // progress is actually the progression PER LAYER (combined in columns)
    // not total because it's not accurate enough
    progress => {
      containerServerActions.progress({name, progress});
    },


    () => {
      containerServerActions.waiting({name, waiting: true});
    });
  },

  updateContainer (name, data) {
    let existing = this.client.getContainer(name);
    existing.inspect((error, existingData) => {
      if (error) {
        containerServerActions.error({name, error});
        return;
      }

      if (existingData.Config && existingData.Config.Image) {
        existingData.Image = existingData.Config.Image;
      }

      if (!existingData.Env && existingData.Config && existingData.Config.Env) {
        existingData.Env = existingData.Config.Env;
      }

      if ((!existingData.Tty || !existingData.OpenStdin) && existingData.Config && (existingData.Config.Tty || existingData.Config.OpenStdin)) {
        existingData.Tty = existingData.Config.Tty;
        existingData.OpenStdin = existingData.Config.OpenStdin;
      }

      data.Mounts = data.Mounts || existingData.Mounts;

      var fullData = _.extend(existingData, data);
      this.createContainer(name, fullData);
    });
  },

  rename (name, newName) {
    this.client.getContainer(name).rename({name: newName}, error => {
      if (error && error.statusCode !== 204) {
        containerServerActions.error({name, error});
        return;
      }
      var oldPath = util.windowsToLinuxPath(path.join(util.home(), util.documents(), 'Kitematic', name));
      var newPath = util.windowsToLinuxPath(path.join(util.home(), util.documents(), 'Kitematic', newName));

      this.client.getContainer(newName).inspect((error, container) => {
        if (error) {
          // TODO: handle error
          containerServerActions.error({newName, error});
        }
        rimraf(newPath, () => {
          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
          }

          container.Mounts.forEach(m => {
            m.Source = m.Source.replace(oldPath, newPath);
          });

          this.updateContainer(newName, {Mounts: container.Mounts});
          rimraf(oldPath, () => {});
        });
      });
    });
  },

  restart (name) {
    this.client.getContainer(name).stop({t: 5}, stopError => {
      if (stopError && stopError.statusCode !== 304) {
        containerServerActions.error({name, stopError});
        return;
      }
      this.client.getContainer(name).start(startError => {
        if (startError && startError.statusCode !== 304) {
          containerServerActions.error({name, startError});
          return;
        }
        this.fetchContainer(name);
      });
    });
  },

  stop (name) {
    this.client.getContainer(name).stop({t: 5}, error => {
      if (error && error.statusCode !== 304) {
        containerServerActions.error({name, error});
        return;
      }
      this.fetchContainer(name);
    });
  },

  start (name) {
    this.client.getContainer(name).start(error => {
      if (error && error.statusCode !== 304) {
        containerServerActions.error({name, error});
        return;
      }
      this.fetchContainer(name);
    });
  },

  destroy (name) {
    if (this.placeholders[name]) {
      containerServerActions.destroyed({id: name});
      delete this.placeholders[name];
      localStorage.setItem('placeholders', JSON.stringify(this.placeholders));
      return;
    }

    let container = this.client.getContainer(name);
    container.unpause(function () {
      container.kill(function () {
        container.remove(function (error) {
          if (error) {
            containerServerActions.error({name, error});
            return;
          }
          containerServerActions.destroyed({id: name});
          var volumePath = path.join(util.home(), 'Kitematic', name);
          if (fs.existsSync(volumePath)) {
            rimraf(volumePath, () => {});
          }
        });
      });
    });
  },

  active (name) {
    this.detach();
    this.activeContainerName = name;

    if (name) {
      this.logs();
    }
  },

  logs () {
    if (!this.activeContainerName) {
      return;
    }

    this.client.getContainer(this.activeContainerName).logs({
      stdout: true,
      stderr: true,
      tail: 1000,
      follow: false,
      timestamps: 1
    }, (err, logStream) => {
      if (err) {
        return;
      }

      let logs = '';
      logStream.setEncoding('utf8');
      logStream.on('data', chunk => logs += chunk);
      logStream.on('end', () => {
        containerServerActions.logs({name: this.activeContainerName, logs});
        this.attach();
      });
    });
  },

  attach () {
    if (!this.activeContainerName) {
      return;
    }

    this.client.getContainer(this.activeContainerName).logs({
      stdout: true,
      stderr: true,
      tail: 0,
      follow: true,
      timestamps: 1
    }, (err, logStream) => {
      if (err) {
        return;
      }

      if (this.stream) {
        this.detach();
      }
      this.stream = logStream;

      let timeout = null;
      let batch = '';
      logStream.setEncoding('utf8');
      logStream.on('data', (chunk) => {
        batch += chunk;
        if (!timeout) {
          timeout = setTimeout(() => {
            containerServerActions.log({name: this.activeContainerName, entry: batch});
            timeout = null;
            batch = '';
          }, 16);
        }
      });
    });
  },

  detach () {
    if (this.stream) {
      this.stream.destroy();
      this.stream = null;
    }
  },

  listen () {
    this.client.getEvents((error, stream) => {
      if (error || !stream) {
        // TODO: Add app-wide error handler
        return;
      }

      stream.setEncoding('utf8');
      stream.pipe(JSONStream.parse()).on('data', data => {
        if (data.status === 'pull' || data.status === 'untag' || data.status === 'delete' ||  data.status === 'attach') {
          return;
        }

        if (data.status === 'destroy') {
          containerServerActions.destroyed({id: data.id});
          this.detach(data.id);
        } else if (data.status === 'kill') {
          containerServerActions.kill({id: data.id});
          this.detach(data.id);
        } else if (data.status === 'stop') {
          containerServerActions.stopped({id: data.id});
          this.detach(data.id);
        } else if (data.status === 'create') {
          this.logs();
          this.fetchContainer(data.id);
        } else if (data.status === 'start') {
          this.attach();
          this.fetchContainer(data.id);
        } else if (data.id) {
          this.fetchContainer(data.id);
        }
      });
    });
  },

  pullImage (repository, tag, callback, progressCallback, blockedCallback) {
    let opts = {}, config = hubUtil.config();
    if (!hubUtil.config()) {
      opts = {};
    } else {
      let [username, password] = hubUtil.creds(config);
      opts = {
        authconfig: {
          username,
          password,
          auth: ''
        }
      };
    }

    this.client.pull(repository + ':' + tag, opts, (err, stream) => {
      if (err) {
        callback(err);
        return;
      }

      stream.setEncoding('utf8');

      // scheduled to inform about progression at given interval
      let tick = null;
      let layerProgress = {};

      // Split the loading in a few columns for more feedback
      let columns = {};
      columns.amount = 4; // arbitrary
      columns.toFill = 0; // the current column index, waiting for layer IDs to be displayed
      let error = null;

      // data is associated with one layer only (can be identified with id)
      stream.pipe(JSONStream.parse()).on('data', data => {
        if (data.error) {
          error = data.error;
          return;
        }

        if (data.status && (data.status === 'Pulling dependent layers' || data.status.indexOf('already being pulled by another client') !== -1)) {
          blockedCallback();
          return;
        }

        if (data.status === 'Pulling fs layer') {
          layerProgress[data.id] = {
            current: 0,
            total: 1
          };
        } else if (data.status === 'Downloading') {
          if (!columns.progress) {
            columns.progress = []; // layerIDs, nbLayers, maxLayers, progress value
            let layersToLoad = _.keys(layerProgress).length;
            let layersPerColumn = Math.floor(layersToLoad / columns.amount);
            let leftOverLayers = layersToLoad % columns.amount;
            for (let i = 0; i < columns.amount; i++) {
              let layerAmount = layersPerColumn;
              if (i < leftOverLayers) {
                layerAmount += 1;
              }
              columns.progress[i] = {layerIDs: [], nbLayers:0 , maxLayers: layerAmount, value: 0.0};
            }
          }

          layerProgress[data.id].current = data.progressDetail.current;
          layerProgress[data.id].total = data.progressDetail.total;

          // Assign to a column if not done yet
          if (!layerProgress[data.id].column) {
            // test if we can still add layers to that column
            if (columns.progress[columns.toFill].nbLayers === columns.progress[columns.toFill].maxLayers && columns.toFill < columns.amount - 1) {
              columns.toFill++;
            }

            layerProgress[data.id].column = columns.toFill;
            columns.progress[columns.toFill].layerIDs.push(data.id);
            columns.progress[columns.toFill].nbLayers++;
          }

          if (!tick) {
            tick = setTimeout(() => {
              clearInterval(tick);
              tick = null;
              for (let i = 0; i < columns.amount; i++) {
                columns.progress[i].value = 0.0;
                if (columns.progress[i].nbLayers > 0) {
                  let layer;
                  let totalSum = 0;
                  let currentSum = 0;

                  for (let j = 0; j < columns.progress[i].nbLayers; j++) {
                    layer = layerProgress[columns.progress[i].layerIDs[j]];
                    totalSum += layer.total;
                    currentSum += layer.current;
                  }

                  if (totalSum > 0) {
                    columns.progress[i].value = Math.min(100.0 * currentSum / totalSum, 100);
                  } else {
                    columns.progress[i].value = 0.0;
                  }
                }
              }
              progressCallback(columns);
            }, 16);
          }
        }
      });
      stream.on('end', function () {
        callback(error);
      });
    });
  }
};
