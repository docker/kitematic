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
import imageServerActions from '../actions/ImageServerActions';
import networkActions from '../actions/NetworkActions';
import networkStore from '../stores/NetworkStore';
import Promise from 'bluebird';
import rimraf from 'rimraf';
import stream from 'stream';
import JSONStream from 'JSONStream';



var DockerUtil = {
  host: null,
  client: null,
  placeholders: {},
  stream: null,
  eventStream: null,
  activeContainerName: null,
  localImages: null,
  imagesUsed: [],

  setup (ip, name) {
    if (!ip && !name) {
      throw new Error('Falsy ip or name passed to docker client setup');
    }
    this.host = ip;

    if (ip.indexOf('local') !== -1) {
      try {
        if (util.isWindows()) {
          this.client = new dockerode({socketPath: '//./pipe/docker_engine'});
        } else {
          this.client = new dockerode({socketPath: '/var/run/docker.sock'});
        }
      } catch (error) {
        throw new Error('Cannot connect to the Docker daemon. Is the daemon running?');
      }
    } else {
      let certDir = process.env.DOCKER_CERT_PATH || path.join(util.home(), '.docker/machine/machines/', name);
      if (!fs.existsSync(certDir)) {
        throw new Error('Certificate directory does not exist');
      }

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
      this.client.version((error,data) => {
        if (!error) {
          version = data.Version;
        } else {
          error_message = error;
        }
        retries++;
      });
      await Promise.delay(500);
    }
    if (version == null) {
       throw new Error(error_message);
    }
    return version;
  },

  init () {
    this.placeholders = JSON.parse(localStorage.getItem('placeholders')) || {};
    this.refresh();
    this.listen();
    this.fetchAllNetworks();

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
        console.log('error starting: %o - %o', name, error);
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

    if (containerData.Config && containerData.Config.Hostname) {
      containerData.Hostname = containerData.Config.Hostname;
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
        if (!containerData.HostConfig) {
          containerData.HostConfig = {};
        }
        containerData.HostConfig.PublishAllPorts = true;
      }

      let networks = [];
      if (!_.has(containerData, 'NetworkingConfig') && _.has(containerData.NetworkSettings, 'Networks')) {
        let EndpointsConfig = {};
        networks = _.keys(containerData.NetworkSettings.Networks);
        if (networks.length) {
          let networkName = networks.shift();
          EndpointsConfig[networkName] = _.extend(containerData.NetworkSettings.Networks[networkName], {Aliases: []});
        }
        containerData.NetworkingConfig = {
          EndpointsConfig
        };
      }

      if (image.Config.Cmd) {
        containerData.Cmd = image.Config.Cmd;
      } else if (!image.Config.Entrypoint) {
        containerData.Cmd = 'sh';
      }

      let existing = this.client.getContainer(name);
      existing.kill(() => {
        existing.remove(() => {
          this.client.createContainer(containerData, (error) => {
            if (error) {
              console.error(err);
              containerServerActions.error({name, error});
              return;
            }
            metrics.track('Container Finished Creating');
            this.addOrRemoveNetworks(name, networks, true).finally(() => {
              this.startContainer(name);
              delete this.placeholders[name];
              localStorage.setItem('placeholders', JSON.stringify(this.placeholders));
              this.refresh();
            });
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
        this.client.getImage(container.Image).inspect((error, image) => {
          if (error) {
            containerServerActions.error({name, error});
            return;
          }
          container.InitialPorts = image.Config.ExposedPorts;
        });

        containerServerActions.updated({container});
        networkActions.clearPending();
      }
    });
  },

  fetchAllContainers () {
    this.client.listContainers({all: true}, (err, containers) => {
      if (err) {
        console.error(err);
        return;
      }
      this.imagesUsed = [];
      async.map(containers, (container, callback) => {
        this.client.getContainer(container.Id).inspect((error, container) => {
          if (error) {
            callback(null, null);
            return;
          }
          let imgSha = container.Image.replace('sha256:', '');
          if (_.indexOf(this.imagesUsed, imgSha) === -1) {
            this.imagesUsed.push(imgSha);
          }
          container.Name = container.Name.replace('/', '');
          this.client.getImage(container.Image).inspect((error, image) => {
            if (error) {
              containerServerActions.error({name, error});
              return;
            }
            container.InitialPorts = image.Config.ExposedPorts;
          });
          callback(null, container);
        });
      }, (err, containers) => {
        containers = containers.filter(c => c !== null);
        if (err) {
          // TODO: add a global error handler for this
          console.error(err);
          return;
        }
        containerServerActions.allUpdated({containers: _.indexBy(containers.concat(_.values(this.placeholders)), 'Name')});
        this.logs();
        this.fetchAllImages();
      });
    });
  },

  fetchAllImages () {
    this.client.listImages((err, list) => {
      if (err) {
        imageServerActions.error(err);
      } else {
        list.map((image, idx) => {
          let imgSha = image.Id.replace('sha256:', '');
          if (_.indexOf(this.imagesUsed, imgSha) !== -1) {
            list[idx].inUse = true;
          } else {
            list[idx].inUse = false;
          }
          let imageSplit = '';
          if (image.RepoTags) {
            imageSplit = image.RepoTags[0].split(':');
          } else {
            imageSplit = image.RepoDigests[0].split('@');
          }
          let repo = imageSplit[0];
          if(imageSplit.length > 2) {
            repo = imageSplit[0]+':'+imageSplit[1];
          }
          if (repo.indexOf('/') === -1) {
            repo = 'local-library/' + repo;
          }
          [list[idx].namespace, list[idx].name] = repo.split('/');
        });
        this.localImages = list;
        imageServerActions.updated(list);
      }
    });
  },

  fetchAllNetworks () {
    this.client.listNetworks((err, networks) => {
      if (err) {
        networkActions.error(err)
      } else {
        networks = networks.sort((n1, n2) => {
          if (n1.Name > n2.Name) {
            return 1;
          }
          if (n1.Name < n2.Name) {
            return -1;
          }
          return 0;
        });
        networkActions.updated(networks);
      }
    });
  },

  updateContainerNetworks(name, connectedNetworks, disconnectedNetworks) {
    networkActions.pending();
    let disconnectedPromise = this.addOrRemoveNetworks(name, disconnectedNetworks, false);

    disconnectedPromise.then(() => {
      let connectedPromise = this.addOrRemoveNetworks(name, connectedNetworks, true);
      connectedPromise.finally(() => {
        this.fetchContainer(name);
      })
    }).catch(() => {
      this.fetchContainer(name);
    });
  },

  addOrRemoveNetworks(name, networks, connect) {
    let promises = _.map(networks, networkName => {
      let network = this.client.getNetwork(networkName);
      let operation = (connect === true ? network.connect : network.disconnect).bind(network);

      return new Promise(function (resolve, reject) {
        operation({
          Container: name
        }, (err, data) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    });

    return Promise.all(promises);
  },

  removeImage (selectedRepoTag) {
    // Prune all dangling image first
    this.localImages.some((image) => {
      if (image.namespace == "<none>" && image.name == "<none>") {
        return false
      }
      if (image.RepoTags) {
        image.RepoTags.map(repoTag => {
          if (repoTag === selectedRepoTag) {
            this.client.getImage(selectedRepoTag).remove({'force': true}, (err, data) => {
              if (err) {
                console.error(err);
                imageServerActions.error(err);
              } else {
                imageServerActions.destroyed(data);
                this.refresh();
              }
            });
            return true;
          }
        });
      }
    });
  },

  run (name, repository, tag, network, local = false) {
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
    let containerData = {
      Image: imageName,
      Tty: true,
      OpenStdin: true,
      NetworkingConfig: {
        EndpointsConfig: {
          [network]: {}
        }
      }
    };
    if (local) {
      this.createContainer(name, containerData);
    } else {
      this.pullImage(repository, tag, error => {
        if (error) {
          containerServerActions.error({name, error});
          this.refresh();
          return;
        }

        if (!this.placeholders[name]) {
          return;
        }

        this.createContainer(name, containerData);
      },

      // progress is actually the progression PER LAYER (combined in columns)
      // not total because it's not accurate enough
      progress => {
        containerServerActions.progress({name, progress});
      },


      () => {
        containerServerActions.waiting({name, waiting: true});
      });
    }
  },

  updateContainer (name, data) {
    let existing = this.client.getContainer(name);
    existing.inspect((error, existingData) => {
      if (error) {
        containerServerActions.error({name, error});
        this.refresh();
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
          this.refresh();
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
        this.refresh();
        return;
      }
      this.client.getContainer(name).start(startError => {
        if (startError && startError.statusCode !== 304) {
          containerServerActions.error({name, startError});
          this.refresh();
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
        this.refresh();
        return;
      }
      this.fetchContainer(name);
    });
  },

  start (name, callback) {
    var self = this;
    this.client.getContainer(name).inspect((error, container) => {
      if (error) {
        containerServerActions.error({name: name, error});
        if(callback) callback(error);
      } else {
        if(container.HostConfig
          && container.HostConfig.Links
          && container.HostConfig.Links.length > 0
          && localStorage.getItem('settings.startLinkedContainers') === 'true'
        ){
          self.startLinkedContainers(name, function(error){
            if(error){
              containerServerActions.error({name: name, error});
              if(callback) callback(error);
            }else{
              self.client.getContainer(name).start(error => {
                if (error && error.statusCode !== 304) {
                  containerServerActions.error({name, error});
                  this.refresh();
                  return;
                }else{
                  self.fetchContainer(name);
                  if(callback) callback(null);
                }
              });
            }
          })
        }else{
          self.client.getContainer(name).start(error => {
            if (error && error.statusCode !== 304) {
              containerServerActions.error({name, error});
              this.refresh();
              return;
            }else{
              self.fetchContainer(name);
              if(callback) callback(null);
            }
          });
        }
      }
    })
  },

  startLinkedContainers (name, callback){
    var self = this;

    this.client.getContainer(name).inspect((error, container) => {
      if (error) {
        containerServerActions.error({name: name, error});
        if(callback) callback(error);
      } else {
        var links = _.map(container.HostConfig.Links, (link, key) => {
          return link.split(":")[0].split("/")[1];
        });

        async.map(links, function(link, cb){
          var linkedContainer = self.client.getContainer(link);
          if(linkedContainer){
            linkedContainer.inspect((error, linkedContainerInfo) => {
              if (error) {
                containerServerActions.error({name: name, error});
                cb(error);
              } else {
                if(linkedContainerInfo.State.Stopping
                  || linkedContainerInfo.State.Downloading
                  || linkedContainerInfo.State.ExitCode
                  || !linkedContainerInfo.State.Running
                  || linkedContainerInfo.State.Updating
                ){
                  self.start(linkedContainerInfo.Id, function(error){
                    if (error) {
                      containerServerActions.error({name: name, error});
                      cb(error);
                    }else{
                      self.fetchContainer(linkedContainerInfo.Id);
                      cb(null);
                    }
                  });
                }else{
                  cb(null);
                }
              }
            });
          }else{
            cb("linked container "+link+" not found");
          }
        }, function(error, containers) {
          if(error){
            containerServerActions.error({name, error});
            if(callback) callback(error);
            return;
          }else{
            if(callback) callback(null);
            return;
          }
        });
      }
    });
  },

  destroy (name) {
    if (this.placeholders[name]) {
      containerServerActions.destroyed({id: name});
      delete this.placeholders[name];
      localStorage.setItem('placeholders', JSON.stringify(this.placeholders));
      this.refresh();
      return;
    }

    let container = this.client.getContainer(name);
    container.unpause( () => {
      container.kill( () => {
        container.remove( (error) => {
          if (error) {
            containerServerActions.error({name, error});
            this.refresh();
            return;
          }
          containerServerActions.destroyed({id: name});
          var volumePath = path.join(util.home(), 'Kitematic', name);
          if (fs.existsSync(volumePath)) {
            rimraf(volumePath, () => {});
          }
          this.refresh();
        });
      });
    });
  },

  active (name) {
    this.detachLog();
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
        // socket hang up can be captured
        console.error(err);
        containerServerActions.error({name: this.activeContainerName, err});
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
        // Socket hang up also can be found here
        console.error(err);
        return;
      }

      this.detachLog()
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

  detachLog() {
    if (this.stream) {
      this.stream.destroy();
      this.stream = null;
    }
  },
  detachEvent() {
    if (this.eventStream) {
      this.eventStream.destroy();
      this.eventStream = null;
    }
  },


  listen () {
    this.detachEvent()
    this.client.getEvents((error, stream) => {
      if (error || !stream) {
        // TODO: Add app-wide error handler
        return;
      }
      // TODO: Add health-check for existing connection

      stream.setEncoding('utf8');
      stream.on('data', json => {
        let data = JSON.parse(json);

        if (data.status === 'pull' || data.status === 'untag' || data.status === 'delete' || data.status === 'attach') {
          this.refresh();
        }

        if (data.status === 'destroy') {
          containerServerActions.destroyed({id: data.id});
          this.detachLog()
        } else if (data.status === 'kill') {
          containerServerActions.kill({id: data.id});
          this.detachLog()
        } else if (data.status === 'stop') {
          containerServerActions.stopped({id: data.id});
          this.detachLog()
        } else if (data.status === 'create') {
          this.logs();
          this.fetchContainer(data.id);
        } else if (data.status === 'start') {
          this.attach();
          this.fetchContainer(data.id);
        } else if (data.id) {
          this.fetchContainer(data.id);
        }

        if (data.Type === 'network') {
          let action = data.Action;
          if (action === 'connect' || action === 'disconnect') {
            // do not fetch container while networks updating via Kitematic
            if (!networkStore.getState().pending) {
              this.fetchContainer(data.Actor.Attributes.container);
            }
          } else if (action === 'create' || action === 'destroy') {
            this.fetchAllNetworks();
          }
        }
      });
      this.eventStream = stream;
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
        console.log('Err: %o', err);
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
              columns.progress[i] = {layerIDs: [], nbLayers: 0, maxLayers: layerAmount, value: 0.0};
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
  },

  refresh () {
    this.fetchAllContainers();
  }
};

module.exports = DockerUtil;
