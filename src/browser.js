import electron from 'electron';
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

import fs from 'fs';
import os from 'os';
import path from 'path';
import child_process from 'child_process';

process.env.NODE_PATH = path.join(__dirname, 'node_modules');
process.env.RESOURCES_PATH = path.join(__dirname, '/../resources');
if (process.platform !== 'win32') {
  process.env.PATH = '/usr/local/bin:' + process.env.PATH;
}

var size = {}, settingsjson = {};
try {
  size = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'size')));
} catch (err) {}

try {
  settingsjson = JSON.parse(fs.readFileSync(path.join(__dirname, 'settings.json'), 'utf8'));
} catch (err) {}

var openURL = null;
app.on('open-url', function (event, url) {
  event.preventDefault();
  openURL = url;
});

app.on('ready', function () {
  var mainWindow = new BrowserWindow({
    width: size.width || 1080,
    height: size.height || 680,
    'min-width': os.platform() === 'win32' ? 400 : 700,
    'min-height': os.platform() === 'win32' ? 260 : 500,
    'standard-window': false,
    resizable: true,
    frame: false,
    show: false
  });

  app.on('open-url', function (event, url) {
    event.preventDefault();
    mainWindow.webContents.send('application:open-url', {
      url: url
    });
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.openDevTools({detach: true});
  }

  mainWindow.loadURL(path.normalize('file://' + path.join(__dirname, 'index.html')));

  app.on('activate-with-no-open-windows', function () {
    if (mainWindow) {
      mainWindow.show();
    }
    return false;
  });

  if (os.platform() === 'win32') {
    mainWindow.on('close', function () {
      mainWindow.webContents.send('application:quitting');
      return true;
    });

    app.on('window-all-closed', function () {
      app.quit();
    });
  } else if (os.platform() === 'darwin') {
    app.on('before-quit', function () {
      mainWindow.webContents.send('application:quitting');
    });
  }

  mainWindow.webContents.on('new-window', function (e) {
    e.preventDefault();
  });

  mainWindow.webContents.on('will-navigate', function (e, url) {
    if (url.indexOf('build/index.html#') < 0) {
      e.preventDefault();
    }
  });

  mainWindow.webContents.on('did-finish-load', function () {
    mainWindow.setTitle('Kitematic');
    mainWindow.show();
    mainWindow.focus();
    if (openURL) {
      mainWindow.webContents.send('application:open-url', {
        url: openURL
      });
    }
  });
});
