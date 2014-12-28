var remote = require('remote');
var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');
var BrowserWindow = remote.require('browser-window');
var app = remote.require('app');

// main.js
var template = [
{
  label: 'Kitematic',
  submenu: [
  {
    label: 'About Kitematic',
    selector: 'orderFrontStandardAboutPanel:'
  },
  {
    type: 'separator'
  },
  {
    label: 'Services',
    submenu: []
  },
  {
    type: 'separator'
  },
  {
    label: 'Hide Kitematic',
    accelerator: 'Command+H',
    selector: 'hide:'
  },
  {
    label: 'Hide Others',
    accelerator: 'Command+Shift+H',
    selector: 'hideOtherApplications:'
  },
  {
    label: 'Show All',
    selector: 'unhideAllApplications:'
  },
  {
    type: 'separator'
  },
  {
    label: 'Quit',
    accelerator: 'Command+Q',
    click: function() { app.quit(); }
  },
  ]
},
{
  label: 'Edit',
  submenu: [
  {
    label: 'Undo',
    accelerator: 'Command+Z',
    selector: 'undo:'
  },
  {
    label: 'Redo',
    accelerator: 'Shift+Command+Z',
    selector: 'redo:'
  },
  {
    type: 'separator'
  },
  {
    label: 'Cut',
    accelerator: 'Command+X',
    selector: 'cut:'
  },
  {
    label: 'Copy',
    accelerator: 'Command+C',
    selector: 'copy:'
  },
  {
    label: 'Paste',
    accelerator: 'Command+V',
    selector: 'paste:'
  },
  {
    label: 'Select All',
    accelerator: 'Command+A',
    selector: 'selectAll:'
  },
  ]
},
{
  label: 'View',
  submenu: [
    {
      label: 'Toggle DevTools',
      accelerator: 'Alt+Command+I',
      click: function() { BrowserWindow.getFocusedWindow().toggleDevTools(); }
    },
  ]
},
{
  label: 'Window',
  submenu: [
  {
    label: 'Minimize',
    accelerator: 'Command+M',
    selector: 'performMiniaturize:'
  },
  {
    label: 'Close',
    accelerator: 'Command+W',
    selector: 'performClose:'
  },
  {
    type: 'separator'
  },
  {
    label: 'Bring All to Front',
    selector: 'arrangeInFront:'
  },
  ]
},
{
  label: 'Help',
  submenu: []
},
];

menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

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

Handlebars.registerHelper('displayTagsAsLabels', function (tags) {
  if (tags) {
    // extract name
    name = tags[0].substr(0, tags[0].indexOf(':'));
    // special handling for <none> tags, since there's no Handlebars.Utils
    name = name.replace("<none>", 'none');
    // build string with labels
    var returnString = name;
    tags.forEach(function (entry) {
      returnString += ' <span class="label label-default">' + entry.substr(entry.indexOf(':') + 1) + '</span>';
    });
    return new Handlebars.SafeString(returnString);
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
  updateBoot2DockerUtilization(function (err) { if (err) {console.log(err);} });
  Meteor.setTimeout(startUpdatingBoot2DockerUtilization, 2000);
};

startSyncingAppState = function () {
  ImageUtil.sync(function (err) {
    if (err) {
      console.log(err);
    }
    AppUtil.sync(function (err) {
      if (err) {
        console.log(err);
      }
    });
  });
  Meteor.setTimeout(startSyncingAppState, 2000);
};
