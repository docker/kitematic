var chokidar = require('chokidar');
var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var exec = require('exec');

var watchers = {};

removeAppWatcher = function (id) {
  if (watchers[id]) {
    watchers[id].watcher.close();
    delete watchers[id];
  }
};

addAppWatcher = function (app) {
  removeAppWatcher(app._id);
  var appPath = path.join(path.join(getHomePath(), 'Kitematic'), app.name);
  var vmDir = path.join('/var/lib/docker/binds', app.name);
  var vmPath = 'ssh://docker@localhost:2022/' + vmDir;
  var watcher = chokidar.watch(appPath, {ignored: /.*\.DS_Store/});
  var syncing = false;
  var willSyncAgain = false;

  var syncFunc = function (event, changedPath) {
    if (syncing) {
      willSyncAgain = true;
      return;
    }
    syncing = true;
    var errorPattern = /The\sfile\s(.*)\son\shost/g;
    var archiveErrorPattern = /Archive\s(.*)\son\shost\s.*\sshould\sbe\sDELETED/g;
    var cmd = path.join(getBinDir(), 'unison');
    var args = [
      cmd,
      vmPath,
      appPath,
      '-prefer',
      vmPath,
      '-servercmd',
      'sudo\ unison',
      '-batch',
      '-log=false',
      '-confirmbigdel=false',
      '-ignore',
      'Name\ {*.tmp,*.unison,*.swp,*.pyc,.DS_Store}',
      '-auto',
      '-sshargs',
      '-o\ UserKnownHostsFile=/dev/null\ -o\ StrictHostKeyChecking=no\ -o PreferredAuthentications=publickey\ -i\ ' + path.join(getHomePath(), '.ssh/id_boot2docker')
    ];

    if (!fs.existsSync(appPath)) {
      args.push('-ignorearchives');
      console.log('Created Kite ' + app.name + ' directory.');
      fs.mkdirSync(appPath, function (err) {
        if (err) { throw err; }
      });
    }

    exec(args, function (err, out, code) {
      try {
        if (err.indexOf('the archives are locked.') !== -1) {
          var results = errorPattern.exec(err);
          var location = results[1].replace(' ', '\\ ');
          exec('/bin/rm -rf ' + location, function () {
            console.log('Removed unison file.');
            console.log(location);
          });
        }
        if (err.indexOf('The archive file is missing on some hosts') !== -1) {
          var results = archiveErrorPattern.exec(err);
          var location = results[1].replace(' ', '\\ ');
          var fullLocation = path.join(getHomePath(), 'Library/Application\\ Support/Unison', location);
          var cmd = '/bin/rm -rf ' + fullLocation;
          exec(cmd, function () {});
        }
      } catch (e) {
        // console.error(e);
      }
      syncing = false;
      if (willSyncAgain) {
        syncFunc();
        willSyncAgain = false;
      }
    });
  };

  watchers[app._id] = {
    watcher: watcher,
    sync: syncFunc
  };

  // do a sync
  syncFunc();
  watcher.on('all', syncFunc);
};

resolveWatchers = function (callback) {
  var apps = Apps.find({}).fetch();
  var ids = _.map(apps, function(app) {
    return app._id;
  });
  var watcherKeys = _.keys(watchers);
  var toAdd = _.difference(ids, watcherKeys);
  var toRemove = _.difference(watcherKeys, ids);

  _.each(toAdd, function (id) {
    addAppWatcher(Apps.findOne(id), function () {});
  });

  _.each(toRemove, function (id) {
    removeAppWatcher(id);
  });

  // Run a sync for 'pulling' changes in the volumes.
  _.each(watchers, function (watcher) {
    watcher.sync();
  });

  callback();
};