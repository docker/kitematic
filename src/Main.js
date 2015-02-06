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
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'http://localhost:35729/livereload.js';
  head.appendChild(script);
}

var bugsnag = require('bugsnag-js');
bugsnag.apiKey = settingsjson.bugsnag;
bugsnag.autoNotify = true;
bugsnag.releaseStage = process.env.NODE_ENV === 'development' ? 'development' : 'production';
bugsnag.notifyReleaseStages = ['production'];
bugsnag.appVersion = app.getVersion();

router.run(Handler => React.render(<Handler/>, document.body));
if (!window.location.hash.length || window.location.hash === '#/') {
  SetupStore.run().then(boot2docker.ip).then(ip => {
    docker.setHost(ip);
    ContainerStore.init(function (err) {
      if (err) { console.log(err); }
      router.transitionTo('containers');
    });
  }).catch(err => {
    bugsnag.notify(err);
  });
} else {
  console.log('Skipping installer.');
  router.transitionTo('containers');
  boot2docker.ip().then(ip => {
    docker.setHost(ip);
    ContainerStore.init(function (err) {
      if (err) { console.log(err); }
    });
  }).catch(err => {
    bugsnag.notify(err);
  });
}
