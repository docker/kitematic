try {
  moment = require('moment');
  gui = require('nw.gui');
  gui.App.clearCache();
  win = gui.Window.get();
  var nativeMenuBar = new gui.Menu({type: 'menubar'});
  nativeMenuBar.createMacBuiltin('Kitematic');
  win.menu = nativeMenuBar;
} catch (e) {
  console.error(e);
}

document.addEventListener('dragover', function (e) {
  e.preventDefault();
  e.stopPropagation();
}, false);

document.addEventListener('drop', function (e) {
  e.preventDefault();
  e.stopPropagation();
}, false);

Handlebars.registerHelper('arrayify', function (obj) {
  var result = [];
  if (obj) {
    _.each(Object.keys(obj), function (key) {
      result.push({name: key, value: obj[key]});
    });
  }
  return result;
});

Handlebars.registerHelper('setTitle', function (title) {
  if (title) {
    document.title = title + ' | Kitematic';
  } else {
    document.title = 'Kitematic';
  }
});

Handlebars.registerHelper('cleanUrl', function (url) {
  var tokens = url.split('/');
  return tokens[2];
});

Handlebars.registerHelper('hasItem', function (array) {
  if (array && typeof array.fetch === 'function') {
    return array.fetch().length > 0;
  } else {
    return array.length > 0;
  }
});

Handlebars.registerHelper('currentYear', function () {
  return moment().format('YYYY');
});

Handlebars.registerHelper('formatDate', function () {
  return moment().format('MM/DD/YYYY - h:mm:ssA');
});

Handlebars.registerHelper('timeSince', function (date) {
  return moment(date).fromNow();
});

Meteor.call('getDockerHost', function (err, host) {
  if (err) { throw err; }
  Session.set('dockerHost', host);
});

fixBoot2DockerVM = function (callback) {
  Boot2Docker.check(function (err) {
    if (err) {
      Session.set('available', false);
      Boot2Docker.resolve(function (err) {
        if (err) {
          callback(err);
        } else {
          Session.set('available', true);
          callback();
        }
      });
    } else {
      callback();
    }
  });
};

fixDefaultImages = function (callback) {
  Meteor.call('checkDefaultImages', function (err) {
    if (err) {
      Session.set('available', false);
      Meteor.call('resolveDefaultImages', function (err) {
        if (err) {
          callback();
        } else {
          Session.set('available', true);
          callback();
        }
      });
    } else {
      Session.set('available', true);
      callback();
    }
  });
};

fixDefaultContainers = function (callback) {
  Meteor.call('checkDefaultContainers', function (err) {
    if (err) {
      Session.set('available', false);
      Meteor.call('resolveDefaultContainers', function (err) {
        if (err) {
          callback(err);
        } else {
          Session.set('available', true);
          callback();
        }
      });
    } else {
      Session.set('available', true);
      callback();
    }
  });
};

Meteor.setInterval(function () {
  Boot2Docker.exists(function (err, exists) {
    if (err) { return; }
    if (exists) {
      Boot2Docker.state(function (err, state) {
        if (err) { return; }
        if (state === 'running') {
          Boot2Docker.info(function (err, info) {
            if (err) { return; }
            Session.set('boot2dockerState', info.state);
            if (info.state !== 'poweroff' && info.memory && info.disk) {
              Session.set('boot2dockerMemoryUsage', info.memory);
              Session.set('boot2dockerDiskUsage', info.disk);
            }
          });
        }
      });
    }
  });
}, 5000);

Meteor.setInterval(function () {
  if (Installs.findOne()) {
    resolveWatchers(function () {});
    fixBoot2DockerVM(function (err) {
      if (err) { console.log(err); return; }
      Meteor.call('recoverApps');
      fixDefaultImages(function (err) {
        if (err) { console.log(err); return; }
        fixDefaultContainers(function (err) {
          if (err) { console.log(err); }
        });
      });
    });
  }
}, 5000);

