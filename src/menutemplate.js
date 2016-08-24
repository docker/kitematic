import electron from 'electron';
const remote = electron.remote;
import shell from 'shell';
import router from './router';
import util from './utils/Util';
import metrics from './utils/MetricsUtil';
import machine from './utils/DockerMachineUtil';
import docker from './utils/DockerUtil';

const app = remote.app;

// main.js
var MenuTemplate = function () {
  return [
    {
      label: 'Kitematic',
      submenu: [
      {
        label: 'About Kitematic',
        enabled: !!docker.host,
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
        accelerator: util.CommandOrCtrl() + '+Alt+H',
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
          label: 'Refresh Container List',
          accelerator: util.CommandOrCtrl() + '+R',
          enabled: !!docker.host,
          click: function() {
            metrics.track('Refreshed Container List', {
              from: 'menu'
            });
            docker.fetchAllContainers();
          }
        },
        {
          label: 'Toggle Chromium Developer Tools',
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
      },
      {
        type: 'separator'
      },
      {
        label: 'Kitematic',
        accelerator: 'Cmd+0',
        click: function () {
          remote.getCurrentWindow().show();
        }
      },
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
