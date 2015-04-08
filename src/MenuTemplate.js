var remote = require('remote');
var app = remote.require('app');
var router = require('./Router');
var util = require('./Util');
var metrics = require('./Metrics');
var machine = require('./DockerMachine');
var docker = require('./Docker');

// main.js
var MenuTemplate = function () {
  return [
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
        accelerator: util.CommandOrCtrl() + '+,',
        enabled: !!docker.host(),
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
        accelerator: util.CommandOrCtrl() + '+H',
        selector: 'hide:'
      },
      {
        label: 'Hide Others',
        accelerator: util.CommandOrCtrl() + '+Shift+H',
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
        accelerator: util.CommandOrCtrl() + '+Q',
        click: function() {
          app.quit();
        }
      }
      ]
    },
    {
      label: 'File',
      submenu: [
      {
        type: 'separator'
      },
      {
        label: 'Open Docker Command Line Terminal',
        accelerator: util.CommandOrCtrl() + '+Shift+T',
        enabled: !!docker.host(),
        click: function() {
          metrics.track('Opened Docker Terminal', {
            from: 'menu'
          });
          machine.dockerTerminal();
        }
      }
      ]
    },
    {
      label: 'Edit',
      submenu: [
      {
        label: 'Undo',
        accelerator: util.CommandOrCtrl() + '+Z',
        selector: 'undo:'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+' + util.CommandOrCtrl() + '+Z',
        selector: 'redo:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: util.CommandOrCtrl() + '+X',
        selector: 'cut:'
      },
      {
        label: 'Copy',
        accelerator: util.CommandOrCtrl() + '+C',
        selector: 'copy:'
      },
      {
        label: 'Paste',
        accelerator: util.CommandOrCtrl() + '+V',
        selector: 'paste:'
      },
      {
        label: 'Select All',
        accelerator: util.CommandOrCtrl() + '+A',
        selector: 'selectAll:'
      }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle DevTools',
          accelerator: 'Alt+' + util.CommandOrCtrl() + '+I',
          click: function() { remote.getCurrentWindow().toggleDevTools(); }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
      {
        label: 'Minimize',
        accelerator: util.CommandOrCtrl() + '+M',
        selector: 'performMiniaturize:'
      },
      {
        label: 'Close',
        accelerator: util.CommandOrCtrl() + '+W',
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
      }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Report Issue or Suggest Feedback',
          click: function () {
            metrics.track('Opened Issue Reporter', {
              from: 'menu'
            });
            util.openPathOrUrl('https://github.com/kitematic/kitematic/issues/new');
          }
        }
      ]
    }
  ];
};

module.exports = MenuTemplate;
