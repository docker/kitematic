var remote = require('remote');
var app = remote.require('app');
var path = require('path');
var docker = require('./Docker');
var BrowserWindow = remote.require('browser-window');
var router = require('./Router');
var util = require('./Util');
var metrics = require('./Metrics');

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
      metrics.track('Opened Docker Terminal');
      var terminal = path.join(process.cwd(), 'resources', 'terminal');
      var cmd = [terminal, `DOCKER_HOST=${'tcp://' + docker.host + ':2376'} DOCKER_CERT_PATH=${path.join(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'], '.boot2docker/certs/boot2docker-vm')} DOCKER_TLS_VERIFY=1 $SHELL`];
      util.exec(cmd).then(() => {});
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
  submenu: [
    {
      label: 'Report an Issue...',
      click: function () {
        util.exec(['open', 'https://github.com/kitematic/kitematic/issues/new']);
      }
    },
  ]
},
];


module.exports = MenuTemplate;
