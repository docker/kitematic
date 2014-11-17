var exec = require('exec');
var path = require('path');
var fs = require('fs');
var Convert = require('ansi-to-html');
var convert = new Convert();

AppUtil = {};

AppUtil.run = function (app) {
  var image = Images.findOne({_id: app.imageId});
  // Delete old container if one already exists
  Docker.removeContainer(app.name, function (err) {
    if (err) { console.error(err); }
    Docker.runContainer(app, image, function (err, container) {
      if (err) { throw err; }
      Docker.getContainerData(container.id, function (err, data) {
        if (err) { console.error(err); }
        // Set a delay for app to spin up
        Meteor.setTimeout(function () {
          Apps.update(app._id, {$set: {
            docker: data,
            status: 'READY'
          }});
        }, 2500);
      });
    });
  });
};

AppUtil.restartHelper = function (app) {
  if (app.docker && app.docker.Id) {
    Docker.restartContainer(app.docker.Id, function (err) {
      if (err) { console.error(err); }
      Docker.getContainerData(app.docker.Id, function (err, data) {
        if (err) { console.error(err); }
        Apps.update(app._id, {$set: {
          status: 'READY',
          docker: data
        }});
      });
    });
  }
};

AppUtil.start = function (appId) {
  var app = Apps.findOne(appId);
  if (app && app.docker) {
    Apps.update(app._id, {$set: {
      status: 'STARTING'
    }});
    Docker.startContainer(app.docker.Id, function (err) {
      if (err) { console.error(err); }
      Docker.getContainerData(app.docker.Id, function (err, data) {
        if (err) { console.error(err); }
        Apps.update(app._id, {$set: {
          status: 'READY',
          docker: data
        }});
      });
    });
  }
};

AppUtil.stop = function (appId) {
  var app = Apps.findOne(appId);
  if (app && app.docker) {
    Apps.update(app._id, {$set: {
      status: 'STOPPING'
    }});
    Docker.stopContainer(app.docker.Id, function (err) {
      if (err) { console.error(err); }
      Meteor.setTimeout(function () {
        Apps.update(app._id, {$set: {
          status: 'STOPPED'
        }});
      }, 2500);
    });
  }
};

AppUtil.restart = function (appId) {
  var app = Apps.findOne(appId);
  if (app && app.docker) {
    Apps.update(app._id, {$set: {
      status: 'STARTING'
    }});
    AppUtil.restartHelper(app);
  }
};

AppUtil.remove = function (appId) {
  var app = Apps.findOne(appId);
  Apps.remove({_id: appId});
  if (app.docker) {
    Docker.removeContainer(app.docker.Id, function (err) {
      if (err) { console.error(err); }
      var appPath = path.join(Util.KITE_PATH, app.name);
      Util.deleteFolder(appPath);
      Docker.removeBindFolder(app.name, function () {
        console.log('Deleted Kite ' + app.name + ' directory.');
      });
    });
  }
};

AppUtil.configVar = function (appId, configVars) {
  Apps.update(appId, {$set: {
    config: configVars,
    status: 'STARTING'
  }});
  var app = Apps.findOne({_id: appId});
  AppUtil.run(app);
};

AppUtil.logs = function (appId) {
  var app = Apps.findOne(appId);
  if (app.docker && app.docker.Id) {
    var container = Docker.client().getContainer(app.docker.Id);
    container.logs({follow: false, stdout: true, stderr: true, timestamps: false, tail: 300}, function (err, response) {
      if (err) { throw err; }
      Apps.update(app._id, {
        $set: {
          logs: []
        }
      });
      response.setEncoding('utf8');
      response.on('data', function (line) {
        Apps.update(app._id, {
          $push: {
            logs: convert.toHtml(line.slice(8))
          }
        });
      });
      response.on('end', function () {});
    });
  }
};

AppUtil.recover = function () {
  var apps = Apps.find({}).fetch();
  _.each(apps, function (app) {
    // Update the app with the latest container info
    if (!app.docker) {
      return;
    }
    var container = Docker.client().getContainer(app.docker.Id);
    container.inspect(function (err, data) {
      if (app.status !== 'STARTING' && app.status !== 'STOPPING' && app.status !== 'STOPPED' && data && data.State && !data.State.Running) {
        console.log('Restarting: ' + app.name);
        console.log(app.docker.Id);
        AppUtil.restartHelper(app, function (err) {
          if (err) { console.error(err); }
        });
      }
    });
  });
};

AppUtil.sync = function () {
  Docker.listContainers(function (err, containers) {
    if (err) {
      console.error(err);
    } else {
      var apps = Apps.find({}).fetch();
      _.each(apps, function (app) {
        var app = Apps.findOne(app._id);
        if (app && app.docker && app.docker.Id) {
          var duplicateApps = Apps.find({'docker.Id': app.docker.Id, _id: {$ne: app._id}}).fetch();
          _.each(duplicateApps, function (duplicateApp) {
            Apps.remove(duplicateApp._id);
          });
          Docker.getContainerData(app.docker.Id, function (err, data) {
            var status = 'STARTING';
            if (data && data.State && data.State.Running) {
              status = 'READY';
            } else if (data && data.State && !data.State.Running) {
              status = 'ERROR';
            }
            Apps.update(app._id, {
              $set: {
                docker: data,
                status: status
              }
            })
          });
        }
      });
      var dockerIds = _.map(apps, function (app) {
        if (app.docker && app.docker.Id) {
          return app.docker.Id;
        }
      });
      var containerIds = _.map(containers, function (container) {
        return container.Id;
      });
      var diffApps = _.difference(dockerIds, containerIds);
      _.each(diffApps, function (appContainerId) {
        var app = Apps.findOne({'docker.Id': appContainerId});
        if (app && app.status !== 'STARTING') {
          AppUtil.remove(app._id);
        }
      });
      var diffContainers = _.reject(containers, function (container) {
        return _.contains(dockerIds, container.Id);
      });
      _.each(diffContainers, function (container) {
        var appName = container.Name.substring(1);
        var startingApp = _.find(apps, function (app) {
          return app.status === 'STARTING' && app.name === appName;
        });
        if (!startingApp && appName !== 'kite-dns') {
          var appPath = path.join(Util.KITE_PATH, appName);
          if (!fs.existsSync(appPath)) {
            console.log('Created Kite ' + appName + ' directory.');
            fs.mkdirSync(appPath, function (err) {
              if (err) { throw err; }
            });
          }
          var envVars = container.Config.Env;
          var config = {};
          _.each(envVars, function (envVar) {
            var eqPos = envVar.indexOf('=');
            var envKey = envVar.substring(0, eqPos);
            var envVal = envVar.substring(eqPos + 1);
            config[envKey] = envVal;
          });
          var status = 'STARTING';
          if (container.State.Running) {
            status = 'READY';
          } else {
            status = 'ERROR';
          }
          var appObj = {
            name: appName,
            docker: container,
            status: status,
            config: config,
            path: appPath,
            logs: [],
            createdAt: new Date()
          };
          console.log(appObj);
          Apps.insert(appObj);
        }
      });
    }
  });
};
