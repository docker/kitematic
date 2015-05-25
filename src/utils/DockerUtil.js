import async from 'async';
import fs from 'fs';
import path from 'path';
import dockerode from 'dockerode';
import _ from 'underscore';
import util from './Util';
import metrics from '../utils/MetricsUtil';
import containerServerActions from '../actions/ContainerServerActions';
import Promise from 'bluebird';
import rimraf from 'rimraf';

export default {
  host: null,
  client: null,
  placeholders: {},

  setup (ip, name) {
    if (!ip || !name) {
      throw new Error('Falsy ip or machine name passed to init');
    }

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

  startContainer (name, containerData) {
    let startopts = {
      Binds: containerData.Binds || []
    };

    if (containerData.NetworkSettings && containerData.NetworkSettings.Ports) {
      startopts.PortBindings = containerData.NetworkSettings.Ports;
    } else {
      startopts.PublishAllPorts = true;
    }

    let container = this.client.getContainer(name);
    container.start(startopts, (error) => {
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

    let existing = this.client.getContainer(name);
    existing.kill(() => {
      existing.remove(() => {
        this.client.createContainer(containerData, (error) => {
          if (error) {
            containerServerActions.error({name, error});
            return;
          }
          metrics.track('Container Finished Creating');
          this.startContainer(name, containerData);
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
          container.Name = container.Name.replace('/', '');
          callback(null, container);
        });
      }, (err, containers) => {
        if (err) {
          // TODO: add a global error handler for this
          return;
        }
        containerServerActions.allUpdated({containers: _.indexBy(containers.concat(_.values(this.placeholders)), 'Name')});
      });
    });
  },

  run (auth, name, repository, tag) {
    tag = tag || 'latest';
    let imageName = repository + ':' + tag;

    let placeholderData = {
      Id: util.randomId(),
      Name: name,
      Image: imageName,
      Config: {
        Image: imageName,
      },
      State: {
        Downloading: true
      }
    };
    containerServerActions.added({container: placeholderData});

    this.placeholders[name] = placeholderData;
    localStorage.setItem('placeholders', JSON.stringify(this.placeholders));

    this.pullImage(auth, repository, tag, error => {
      if (error) {
        containerServerActions.error({name, error});
        return;
      }

      if (!this.placeholders[name]) {
        return;
      }

      delete this.placeholders[name];
      localStorage.setItem('placeholders', JSON.stringify(this.placeholders));
      this.createContainer(name, {Image: imageName});
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
      existingData.name = existingData.Name || name;

      if (existingData.Config && existingData.Config.Image) {
        existingData.Image = existingData.Config.Image;
      }

      if (!existingData.Env && existingData.Config && existingData.Config.Env) {
        existingData.Env = existingData.Config.Env;
      }

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
      var oldPath = path.join(util.home(), 'Kitematic', name);
      var newPath = path.join(util.home(), 'Kitematic', newName);

      this.client.getContainer(newName).inspect((error, container) => {
        if (error) {
          // TODO: handle error
          containerServerActions.error({newName, error});
        }
        rimraf(newPath, () => {
          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
          }
          var binds = _.pairs(container.Volumes).map(function (pair) {
            return pair[1] + ':' + pair[0];
          });
          var newBinds = binds.map(b => {
            return b.replace(path.join(util.home(), 'Kitematic', name), path.join(util.home(), 'Kitematic', newName));
          });
          this.updateContainer(newName, {Binds: newBinds});
          rimraf(oldPath, () => {});
        });
      });
    });
  },

  restart (name) {
    let container = this.client.getContainer(name);
    container.stop(error => {
      if (error && error.statusCode !== 304) {
        containerServerActions.error({name, error});
        return;
      }
      container.inspect((error, data) => {
        if (error) {
          containerServerActions.error({name, error});
        }
        this.startContainer(name, data);
      });
    });
  },

  stop (name) {
    this.client.getContainer(name).stop(error => {
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
      container.kill(function (error) {
        if (error) {
          containerServerActions.error({name, error});
          return;
        }
        container.remove(function () {
          containerServerActions.destroyed({id: name});
          var volumePath = path.join(util.home(), 'Kitematic', name);
          if (fs.existsSync(volumePath)) {
            rimraf(volumePath, () => {});
          }
        });
      });
    });
  },

  listen () {
    this.client.getEvents((error, stream) => {
      if (error || !stream) {
        // TODO: Add app-wide error handler
        return;
      }

      stream.setEncoding('utf8');
      stream.on('data', json => {
        let data = JSON.parse(json);
        // console.log(data);

        if (data.status === 'pull' || data.status === 'untag' || data.status === 'delete') {
          return;
        }

        if (data.status === 'destroy') {
          containerServerActions.destroyed({name: data.id});
        } else if (data.status === 'create') {
          this.fetchAllContainers();
        } else {
          this.fetchContainer(data.id);
        }
      });
    });
  },

  pullImage (auth, repository, tag, callback, progressCallback, blockedCallback) {
    this.client.pull(repository + ':' + tag, (err, stream) => {
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

      // data is associated with one layer only (can be identified with id)
      stream.on('data', str => {
        var data = JSON.parse(str);

        if (data.error) {
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
              columns.progress[i] = {layerIDs: [], nbLayers:0, maxLayers: layerAmount, value: 0.0};
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

                // Start only if the column has accurate values for all layers
                if (columns.progress[i].nbLayers === columns.progress[i].maxLayers) {
                  let layer;
                  let totalSum = 0;
                  let currentSum = 0;

                  for (let j = 0; j < columns.progress[i].nbLayers; j++) {
                    layer = layerProgress[columns.progress[i].layerIDs[j]];
                    totalSum += layer.total;
                    currentSum += layer.current;
                  }

                  if (totalSum > 0) {
                    columns.progress[i].value = 100.0 * currentSum / totalSum;
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
        callback();
      });
    });
  },

  // TODO: move this to machine health checks
  waitForConnection (tries, delay) {
    tries = tries || 10;
    delay = delay || 1000;
    let tryCount = 1, connected = false;
    return new Promise((resolve, reject) => {
      async.until(() => connected, callback => {
        this.client.listContainers(error => {
          if (error) {
            if (tryCount > tries) {
              callback(Error('Cannot connect to the Docker Engine. Either the VM is not responding or the connection may be blocked (VPN or Proxy): ' + error.message));
            } else {
              tryCount += 1;
              setTimeout(callback, delay);
            }
          } else {
            connected = true;
            callback();
          }
        });
      }, error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
};
