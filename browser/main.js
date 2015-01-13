var child_process = require('child_process');
var net = require('net');
var os = require('os');
var fs = require('fs');
var path = require('path');
var exec = require('exec');

var autoUpdater = require('auto-updater');
var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');

var argv = require('minimist')(process.argv);

if (argv.test) {
  console.log('Running tests');
}

app.on('activate-with-no-open-windows', function () {
  if (mainWindow) {
    mainWindow.show();
  }
  return false;
});

app.on('ready', function() {
  // Create the browser window.
  var windowOptions = {
    width: 1200,
    height: 800,
    'min-width': 1080,
    'min-height': 560,
    resizable: true,
    frame: false
  };
  mainWindow = new BrowserWindow(windowOptions);
  mainWindow.hide();

  if (argv.test) {
    mainWindow.loadUrl('file://' + __dirname + '/../build/specs.html');
  } else {
    mainWindow.loadUrl('file://' + __dirname + '/../build/index.html');
  }

  process.on('uncaughtException', app.quit);

  var saveVMOnQuit = true;
  app.on('will-quit', function (e) {
    if (saveVMOnQuit) {
      // exec('VBoxManage controlvm boot2docker-vm savestate', function (stderr, stdout, code) {});
    }
  });

  mainWindow.webContents.on('new-window', function (e) {
    e.preventDefault();
  });

  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show();
    mainWindow.focus();

    mainWindow.setTitle('');

    // Auto Updates
    autoUpdater.setFeedUrl('https://updates.kitematic.com/releases/latest?version=' + app.getVersion());

    autoUpdater.on('checking-for-update', function (e) {
      console.log('Checking for update...');
    });

    autoUpdater.on('update-available', function (e) {
      console.log('Update available.');
      console.log(e);
    });

    autoUpdater.on('update-not-available', function (e) {
      console.log('Update not available.');
    });

    autoUpdater.on('update-downloaded', function (e, releaseNotes, releaseName, releaseDate, updateURL) {
      console.log('Update downloaded.');
      mainWindow.webContents.send('notify', 'window:update-available');
    });

    autoUpdater.on('error', function (e) {
      console.log('An error occured while checking for updates.');
      console.log(e);
    });

    ipc.on('command', function (event, arg) {
      console.log('Command: ' + arg);
      if (arg === 'application:quit-install') {
        saveVMOnQuit = false;
        autoUpdater.quitAndInstall();
      }
    });

    autoUpdater.checkForUpdates();
  });
});
