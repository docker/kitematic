var child_process = require('child_process');
var net = require('net');
var os = require('os');
var fs = require('fs');
var path = require('path');

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
        child_process.exec('kill $(ps aux -e | grep \'DB_PURPOSE=KITEMATIC\' | awk \'{print $2}\')', function (error, stdout, stderr) {
          var command = 'DB_PURPOSE=KITEMATIC ' + process.cwd() + '/resources/mongod --bind_ip 127.0.0.1 --dbpath ' + dataPath.replace(' ', '\\ ') + ' --port ' + mongoPort + ' --unixSocketPrefix ' + dataPath.replace(' ', '\\ ');
          console.log(command);
          var mongoChild = child_process.exec(command, function (error, stdout, stderr) {
            console.log(error);
            console.log(stdout);
            console.log(stderr);
          });

          process.stdout.write(process.cwd());
          var rootUrl = 'http://localhost:' + webPort;
          var user_env = process.env;
          process.env.ROOT_URL = rootUrl;
          process.env.PORT = webPort;
          process.env.BIND_IP = '127.0.0.1';
          process.env.DB_PATH = dataPath;
          process.env.MONGO_URL = 'mongodb://localhost:' + mongoPort + '/meteor';
          process.argv.splice(2, 0, 'program.json');
          require('./bundle/main.js');
          callback(process.env.ROOT_URL);
        });
      });
    });
  }
};

start(function (url) {
  var gui = require('nw.gui');
  var mainWindow = gui.Window.get();
  gui.App.on('reopen', function () {
    mainWindow.show();
  });
  setTimeout(function () {
    mainWindow.window.location = url;
    mainWindow.on('loaded', function () {
      mainWindow.show();
    });
  }, 600);
  mainWindow.on('close', function (type) {
    this.hide();
    if (type === 'quit') {
      this.close(false);
    }
    console.log('Window Closed.');
  });
});
