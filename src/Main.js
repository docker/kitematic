require.main.paths.splice(0, 0, process.env.NODE_PATH);

var remote = require('remote');
var app = remote.require('app');
var React = require('react');
var fs = require('fs');
var path = require('path');
var docker = require('./Docker');
var router = require('./router');
var boot2docker = require('./boot2docker');
var ContainerStore = require('./ContainerStore');
var SetupStore = require('./ContainerStore');
var settingsjson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'settings.json'), 'utf8'));

if (process.env.NODE_ENV === 'development') {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'http://localhost:35729/livereload.js';
  var head = document.getElementsByTagName('head')[0];
  head.appendChild(script);
} else {
  var bugsnag = require('bugsnag-js');
  bugsnag.apiKey = settingsjson.bugsnag;
  bugsnag.autoNotify = true;
  bugsnag.releaseStage = process.env.NODE_ENV === 'development' ? 'development' : 'production';
  bugsnag.notifyReleaseStages = ['production'];
  bugsnag.appVersion = app.getVersion();
}

if (!window.location.hash.length || window.location.hash === '#/') {
  router.run(function (Handler) {
    React.render(<Handler/>, document.body);
  });
  SetupStore.run(function (err) {
    if (err) { console.log(err); }
    boot2docker.ip(function (err, ip) {
      if (err) { console.log(err); }
      docker.setHost(ip);
      router.transitionTo('containers');
      ContainerStore.init(function (err) {
        if (err) { console.log(err); }
      });
    });
  });
} else {
  router.run(function (Handler) {
    React.render(<Handler/>, document.body);
  });
  boot2docker.ip(function (err, ip) {
    if (err) { console.log(err); }
    docker.setHost(ip);
    ContainerStore.init(function (err) {
      if (err) { console.log(err); }
    });
  });
}
