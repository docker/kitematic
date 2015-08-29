var remote = require('remote');
var app = remote.require('app');
var shell = require('shell');
var router = require('./router');
var util = require('./utils/Util');
var setupUtil = require('./utils/SetupUtil');
var metrics = require('./utils/MetricsUtil');
var machine = require('./utils/DockerMachineUtil');
var compose = require('./utils/DockerComposeUtil');
var dialog = remote.require('dialog');
import docker from './utils/DockerUtil';

// main.js
var MenuTemplate = function () {
  return [
    {
      label: 'Kitematic',
      submenu: [
      {
        label: 'About Kitematic',
        click: function () {
          metrics.track('Opened About', {
            from: 'menu'
          });
          router.get().transitionTo('about');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Preferences',
        accelerator: util.CommandOrCtrl() + '+,',
        enabled: !!docker.host,
        click: function () {
          metrics.track('Opened Preferences', {
            from: 'menu'
          });
          router.get().transitionTo('preferences');
        }
      },
      {
        type: 'separator'
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
        label: 'Open Compose File',
        accelerator: util.CommandOrCtrl() + '+O',
        click: function () {
          dialog.showOpenDialog({
            properties: [ 'openFile' ],
            filters: [{ name: 'Docker Compose File', extensions: ['yml'] }]
          }, (files) => {
            machine.env().then((vmEnv)=> {
              compose.up(files[0], vmEnv).then((info) => {
                console.log('compose: ', info);
                dialog.showMessageBox({'title': 'Docker Compose Successful',
                                       'message': 'All containers have been created',
                                       'buttons': ['OK']
                                     });
              }).catch((err) => {
                console.error('Error generated: %o', err.message);
                dialog.showMessageBox({'title': 'Docker Compose Error',
                                       'message': err.message,
                                       'buttons': ['Dismiss']
                                     });
              });
            });
          });
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Open Docker Command Line Terminal',
        accelerator: util.CommandOrCtrl() + '+Shift+T',
        enabled: !!docker.host,
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
            shell.openExternal('https://github.com/kitematic/kitematic/issues/new');
          }
        }
      ]
    }
  ];
};

module.exports = MenuTemplate;
