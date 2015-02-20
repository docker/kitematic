var app = require('app');
var fs = require('fs');
var path = require('path');
var exec = require('exec');
var autoUpdater = require('auto-updater');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var argv = require('minimist')(process.argv);
var settingsjson;
try {
  settingsjson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'settings.json'), 'utf8'));
} catch (err) {
  settingsjson = {};
}

process.env.NODE_PATH = __dirname + '/../node_modules';
process.env.RESOURCES_PATH = __dirname + '/../resources';
process.chdir(path.join(__dirname, '..'));
process.env.PATH = '/usr/local/bin:' + process.env.PATH;

if (argv.integration) {
  process.env.TEST_TYPE = 'integration';
} else {
  process.env.TEST_TYPE = 'test';
}

app.commandLine.appendSwitch('js-flags', '--harmony');

var mainWindow = null;
var windowOptions = {
  width: 1000,
  height: 700,
  'min-width': 1000,
  'min-height': 700,
  resizable: true,
  frame: false,
  show: false
};

app.on('activate-with-no-open-windows', function () {
  if (mainWindow) {
    mainWindow.show();
  }
  return false;
});

app.on('ready', function() {
  mainWindow = new BrowserWindow(windowOptions);
  var saveVMOnQuit = false;
  if (argv.test) {
    mainWindow.loadUrl(path.normalize('file://' + path.join(__dirname, '..', 'build/tests.html')));
  } else {
    mainWindow.loadUrl(path.normalize('file://' + path.join(__dirname, '..', 'build/index.html')));
    app.on('will-quit', function () {
      if (saveVMOnQuit) {
        exec('VBoxManage controlvm boot2docker-vm savestate', function () {});
      }
    });
  }

  mainWindow.webContents.on('new-window', function (e) {
    e.preventDefault();
  });

  mainWindow.webContents.on('will-navigate', function (e, url) {
    console.log(url);
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
      autoUpdater.setFeedUrl('https://updates.kitematic.com/releases/latest?version=' + app.getVersion() + '&beta=' + !!settingsjson.beta);

      autoUpdater.on('checking-for-update', function () {
        console.log('Checking for update...');
      });

      autoUpdater.on('update-available', function (e) {
        console.log('Update available.');
        console.log(e);
      });

      autoUpdater.on('update-not-available', function () {
        console.log('Update not available.');
      });

      autoUpdater.on('update-downloaded', function (e, releaseNotes, releaseName, releaseDate, updateURL) {
        console.log(e, releaseNotes, releaseName, releaseDate, updateURL);
        console.log('Update downloaded.');
        console.log(releaseNotes, releaseName, releaseDate, updateURL);
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
    }

    ipc.on('vm', function (event, arg) {
      saveVMOnQuit = arg;
    });
  });
});
