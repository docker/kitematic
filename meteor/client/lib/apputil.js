var exec = require('exec');
var path = require('path');
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
        // Use dig to refresh the DNS
        exec('/usr/bin/dig ' + app.name + '.kite @172.17.42.1', function(err, stdout, stderr) {
          console.log(err);
          console.log(stdout);
          console.log(stderr);
          Apps.update(app._id, {$set: {
            status: 'READY',
            docker: data
          }});
        });
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
    Docker.getContainerData(app.docker.Id, function (err, data) {
      if (err) { console.error(err); }
      // Use dig to refresh the DNS
      exec('/usr/bin/dig ' + app.name + '.kite @172.17.42.1', function(err, stdout, stderr) {
        console.log(err);
        console.log(stdout);
        console.log(stderr);
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
  if (app.docker) {
    Apps.remove({_id: appId});
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
