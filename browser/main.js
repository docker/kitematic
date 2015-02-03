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
var settingsjson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'settings.json'), 'utf8'));

process.env.NODE_PATH = __dirname + '/../node_modules';
process.env.RESOURCES_PATH = __dirname + '/../resources';
process.chdir(path.join(__dirname, '..'));

if (argv.integration) {
  process.env.TEST_TYPE = 'integration';
} else {
  process.env.TEST_TYPE = 'test';
}

app.on('activate-with-no-open-windows', function () {
  if (mainWindow) {
    mainWindow.show();
  }
  return false;
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    'min-width': 1000,
    'min-height': 700,
    resizable: true,
    frame: false,
    show: false
  });

  var saveVMOnQuit = false;

  if (argv.test) {
    mainWindow.loadUrl(path.normalize('file://' + path.join(__dirname, '..', 'tests/tests.html')));
  } else {
    mainWindow.loadUrl(path.normalize('file://' + path.join(__dirname, '..', 'build/index.html')));
    app.on('will-quit', function (e) {
      if (saveVMOnQuit) {
        exec('VBoxManage controlvm boot2docker-vm savestate', function (stderr, stdout, code) {});
      }
    });
  }

  mainWindow.webContents.on('new-window', function (e) {
    e.preventDefault();
  });

  mainWindow.webContents.on('did-finish-load', function() {
    if (!argv.test) {
      mainWindow.show();
    }
    mainWindow.focus();
    mainWindow.setTitle('');

    // Auto Updates
    if (process.env.NODE_ENV !== 'development' && !argv.test) {
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
    }

    ipc.on('vm', function (event, arg) {
      saveVMOnQuit = arg;
    });
  });
});
