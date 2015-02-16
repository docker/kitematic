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
var SetupStore = require('./SetupStore');
var MenuTemplate = require('./MenuTemplate');
var Menu = remote.require('menu');
var settingsjson;

try {
  settingsjson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'settings.json'), 'utf8'));
} catch (err) {
  settingsjson = {};
}

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

var menu = Menu.buildFromTemplate(MenuTemplate);
Menu.setApplicationMenu(menu);

router.run(Handler => React.render(<Handler/>, document.body));
SetupStore.run().then(boot2docker.ip).then(ip => {
  console.log(ip);
  docker.setHost(ip);
  ContainerStore.init(function (err) {
    if (err) { console.log(err); }
    router.transitionTo('containers');
  });
}).catch(err => {
  console.log(err);
  bugsnag.notify(err);
});
