try {
  moment = require('moment');
  // gui = require('nw.gui');
  // gui.App.clearCache();
  // win = gui.Window.get();
  // var nativeMenuBar = new gui.Menu({type: 'menubar'});
  // nativeMenuBar.createMacBuiltin('Kitematic');
  // win.menu = nativeMenuBar;
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

Handlebars.registerHelper('isUpdating', function () {
  return Session.get('isUpdating');
});

var fixBoot2DockerVM = function (callback) {
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

var fixDefaultImages = function (callback) {
  Docker.checkDefaultImages(function (err) {
    if (err) {
      Session.set('available', false);
      Docker.resolveDefaultImages(function (err) {
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

var fixDefaultContainers = function (callback) {
  Docker.checkDefaultContainers(function (err) {
    if (err) {
      Session.set('available', false);
      Docker.resolveDefaultContainers(function (err) {
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
    if (err) { console.log(err); return; }
    if (exists) {
      Boot2Docker.state(function (err, state) {
        if (err) { console.log(err); return; }
        Session.set('boot2dockerState', state);
        if (state === 'running') {
          Boot2Docker.stats(function (err, stats) {
            if (err) { console.log(err); return; }
            if (stats.state !== 'poweroff' && stats.memory && stats.disk) {
              Session.set('boot2dockerMemoryUsage', stats.memory);
              Session.set('boot2dockerDiskUsage', stats.disk);
            }
          });
        }
      });
    }
  });
}, 5000);

Meteor.setInterval(function () {
  if (!Session.get('installing')) {
    Sync.resolveWatchers(function () {});
    if (!Session.get('boot2dockerOff')) {
      fixBoot2DockerVM(function (err) {
        if (err) { console.log(err); return; }
        //AppUtil.recover();
        fixDefaultImages(function (err) {
          if (err) { console.log(err); return; }
          fixDefaultContainers(function (err) {
            if (err) { console.log(err); }
          });
        });
      });
    }
  }
}, 5000);

Meteor.setInterval(function () {
  if (!Session.get('installing')) {
    ImageUtil.sync();
    AppUtil.sync();
  }
}, 5000);
