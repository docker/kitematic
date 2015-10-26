import app from 'app';
import BrowserWindow from 'browser-window';
import fs from 'fs';
import os from 'os';
import ipc from 'ipc';
import path from 'path';
import child_process from 'child_process';

process.env.NODE_PATH = path.join(__dirname, 'node_modules');
process.env.RESOURCES_PATH = path.join(__dirname, '/../resources');
process.env.PATH = '/usr/local/bin:' + process.env.PATH;

var size = {}, settingsjson = {};
try {
  size = JSON.parse(fs.readFileSync(path.join(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'], 'Library', 'Application\ Support', 'Kitematic', 'size')));
} catch (err) {}
try {
  settingsjson = JSON.parse(fs.readFileSync(path.join(__dirname, 'settings.json'), 'utf8'));
} catch (err) {}

let updateCmd = (args, cb) => {
  let updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
  let child = child_process.spawn(updateExe, args, {detached: true});
  child.on('close', cb);
};

if (process.platform === 'win32') {
  var squirrelCommand = process.argv[1];
  let target = path.basename(process.execPath);
  switch (squirrelCommand) {
    case '--squirrel-install':
    case '--squirrel-updated':
      updateCmd(['--createShortcut', target], app.quit);
      break;
    case '--squirrel-uninstall':
      updateCmd(['--removeShortcut', target], app.quit);
      break;
    case '--squirrel-obsolete':
      app.quit();
      break;
  }
}

app.on('ready', function () {
  var mainWindow = new BrowserWindow({
    width: size.width || 1000,
    height: size.height || 680,
    'min-width': os.platform() === 'win32' ? 400 : 700,
    'min-height': os.platform() === 'win32' ? 260 : 500,
    'standard-window': false,
    resizable: true,
    frame: false,
    show: false
  });

  mainWindow.loadUrl(path.normalize('file://' + path.join(__dirname, 'index.html')));

  app.on('activate-with-no-open-windows', function () {
    if (mainWindow) {
      mainWindow.show();
    }
    return false;
  });

  var updating = false;
  ipc.on('application:quit-install', function () {
    updating = true;
  });

  if (os.platform() === 'win32') {
    mainWindow.on('close', function () {
      mainWindow.webContents.send('application:quitting');
      return true;
    });

    app.on('window-all-closed', function() {
      app.quit();
    });
  } else if (os.platform() === 'darwin') {
    app.on('before-quit', function () {
      if (!updating) {
        mainWindow.webContents.send('application:quitting');
      }
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
  });
});
