try {
  moment = require('moment');
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

Handlebars.registerHelper('displayTags', function (tags, delimiter) {
  if (tags) {
    return tags.join(delimiter);
  } else {
    return '';
  }
});

updateBoot2DockerUtilization = function (callback) {
  Boot2Docker.exists(function (err, exists) {
    if (err) { callback(err); return; }
    if (exists) {
      Boot2Docker.state(function (err, state) {
        if (err) { callback(err); return; }
        Session.set('boot2dockerState', state);
        if (state === 'running') {
          Boot2Docker.stats(function (err, stats) {
            if (err) { callback(err); return; }
            if (stats.state !== 'poweroff' && stats.memory && stats.disk) {
              Session.set('boot2dockerMemoryUsage', stats.memory);
              Session.set('boot2dockerDiskUsage', stats.disk);
            }
            callback();
          });
        } else {
          callback();
        }
      });
    }
  });
};

startUpdatingBoot2DockerUtilization = function () {
  updateBoot2DockerUtilization(function (err) {
    if (err) {console.log(err);}
    Meteor.setTimeout(startUpdatingBoot2DockerUtilization, 2000);
  });
};

startSyncingAppState = function () {
  ImageUtil.sync(function (err) {
    if (err) {console.log(err);}
    AppUtil.sync(function (err) {
      if (err) {console.log(err);}
      Meteor.setTimeout(startSyncingAppState, 2000);
    });
  });
};