var remote = require('remote');
var app = remote.require('app');
<<<<<<< HEAD
=======
var path = require('path');
var docker = require('./Docker');
>>>>>>> master
var router = require('./Router');
var util = require('./Util');
var metrics = require('./Metrics');
var machine = require('./DockerMachine');

// main.js
var MenuTemplate = [
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
    label: 'Preferences',
    accelerator: 'Command+,',
    click: function () {
      metrics.track('Opened Preferences', {
        from: 'menu'
      });
      router.transitionTo('preferences');
    }
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
    click: function() {
      app.quit();
    }
  },
  ]
},
{
  label: 'File',
  submenu: [
  {
    type: 'separator'
  },
  {
    label: 'Open Docker Terminal',
    accelerator: 'Command+Shift+T',
    click: function() {
      metrics.track('Opened Docker Terminal', {
        from: 'menu'
      });
      machine.dockerTerminal();
    }
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
      click: function() { remote.getCurrentWindow().toggleDevTools(); }
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
    click: function () {
      remote.getCurrentWindow().hide();
    }
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
  submenu: [
    {
      label: 'Report an Issue...',
      click: function () {
        metrics.track('Opened Issue Reporter', {
          from: 'menu'
        });
        util.exec(['open', 'https://github.com/kitematic/kitematic/issues/new']);
      }
    },
  ]
},
];


module.exports = MenuTemplate;
