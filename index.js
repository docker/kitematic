var child_process = require('child_process');
var net = require('net');
var os = require('os');
var fs = require('fs');
var path = require('path');

var app = require('app');
var BrowserWindow = require('browser-window');

var freeport = function (callback) {
  var server = net.createServer();
  var port = 0;
  server.on('listening', function() {
    port = server.address().port;
    server.close();
  });
  server.on('close', function() {
    callback(null, port);
  });
  server.listen(0, '127.0.0.1');
};

var start = function (callback) {
  if (process.env.NODE_ENV === 'development') {
    callback('http://localhost:3000');
  } else {
    process.stdout.write('Starting production server\n');
    if (os.platform() === 'darwin') {
      var kitePath = path.join(process.env.HOME, 'Library/Application Support/Kitematic/');
      var dataPath = path.join(kitePath, 'data');
      console.log(dataPath);
      var bundlePath = path.join(kitePath, 'bundle');
      if (!fs.existsSync(kitePath)) {
        fs.mkdirSync(kitePath);
      }
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
      }
      if (!fs.existsSync(bundlePath)) {
        fs.mkdirSync(bundlePath);
      }
    }

    // One for meteor, one for mongo
    freeport(function (err, webPort) {
      freeport(function(err, mongoPort) {
        console.log('MongoDB: ' + mongoPort);
        console.log('webPort: ' + webPort);
        child_process.exec('kill $(ps aux -e | grep PURPOSE=KITEMATIC | awk \'{print $2}\') && rm ' + path.join(dataPath, 'mongod.lock'), function (error, stdout, stderr) {
          var mongoChild = child_process.spawn(path.join(process.cwd(), 'resources', 'mongod'), ['--bind_ip', '127.0.0.1', '--dbpath', dataPath, '--port', mongoPort, '--unixSocketPrefix', dataPath], {
            env: {
              PURPOSE: 'KITEMATIC'
            }
          });
          var started = false;
          mongoChild.stdout.setEncoding('utf8');
          mongoChild.stdout.on('data', function (data) {
            if (data.indexOf('waiting for connections on port ' + mongoPort)) {
              if (!started) {
                started = true;
              } else {
                return;
              }

              console.log('Starting node child...');
              var rootURL = 'http://localhost:' + webPort;
              var user_env = process.env;
              user_env.ROOT_URL = rootURL;
              user_env.PORT = webPort;
              user_env.BIND_IP = '127.0.0.1';
              user_env.DB_PATH = dataPath;
              user_env.MONGO_URL = 'mongodb://localhost:' + mongoPort + '/meteor';
              user_env.METEOR_SETTINGS = fs.readFileSync(path.join(process.cwd(), 'resources', 'settings.json'), 'utf8');
              var nodeChild = child_process.spawn(path.join(process.cwd(), 'resources', 'node'), ['./bundle/main.js'], {
                env: user_env
              });

              var opened = false;
              nodeChild.stdout.setEncoding('utf8');
              nodeChild.stdout.on('data', function (data) {
                console.log(data);
                if (data.indexOf('Kitematic started.') !== -1) {
                  if (!opened) {
                    opened = true;
                  } else {
                    return;
                  }
                  callback(rootURL, nodeChild, mongoChild);
                }
              });
            }
          });
        });
      });
    });
  }
};

app.on('activate-with-no-open-windows', function () {
  mainWindow.show();
  return false;
});

app.on('ready', function() {
  start(function (url, nodeChild, mongoChild) {
    var cleanUpChildren = function () {
      console.log('Cleaning up children.')
      mongoChild.kill();
      nodeChild.kill();
      app.quit();
      process.exit();
    };

    if (nodeChild && mongoChild) {
      process.on('exit', cleanUpChildren);
      process.on('uncaughtException', cleanUpChildren);
      process.on('SIGINT', cleanUpChildren);
      process.on('SIGTERM', cleanUpChildren);
    }

    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 578, frame:false, resizable: false});

    // and load the index.html of the app.
    mainWindow.loadUrl(url);
    mainWindow.show();
  });
});
