var remote = require('remote');
require.main.paths.splice(0, 0, process.env.NODE_PATH);
var app = remote.require('app');
var React = require('react');
var fs = require('fs');
var path = require('path');
var docker = require('./Docker');
var router = require('./Router');
var ContainerStore = require('./ContainerStore');
var SetupStore = require('./SetupStore');
var metrics = require('./Metrics');
var template = require('./MenuTemplate');
var util = require('./Util');
var Menu = remote.require('menu');
var bugsnag = require('bugsnag-js');

window.addEventListener('resize', function () {
  fs.writeFileSync(path.join(util.supportDir(), 'size'), JSON.stringify({
    width: window.outerWidth,
    height: window.outerHeight
  }));
});

Menu.setApplicationMenu(Menu.buildFromTemplate(template()));

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

bugsnag.apiKey = settingsjson.bugsnag;
bugsnag.autoNotify = true;
bugsnag.releaseStage = process.env.NODE_ENV === 'development' ? 'development' : 'production';
bugsnag.notifyReleaseStages = ['production'];
bugsnag.appVersion = app.getVersion();
bugsnag.metaData = {
  beta: !!settingsjson.beta
};

bugsnag.beforeNotify = function(payload) {
  var re = new RegExp(util.home().replace(/\s+/g, '\\s+'), 'g');
  payload.stacktrace = payload.stacktrace.replace(/%20/g, ' ').replace(re, '<redacted homedir>');
  payload.context = payload.context.replace(/%20/g, ' ').replace(re, '<redacted homedir>');
  payload.file = payload.file.replace(/%20/g, ' ').replace(re, '<redacted homedir>');
  payload.url = '<redacted url>';
};

document.onkeydown = function (e) {
  e = e || window.event;
  var doPrevent;
  if (e.keyCode === 8) {
    var d = e.srcElement || e.target;
    if (d.tagName.toUpperCase() === 'INPUT' || d.tagName.toUpperCase() === 'TEXTAREA') {
      doPrevent = d.readOnly || d.disabled;
    } else {
      doPrevent = true;
    }
  } else {
    doPrevent = false;
  }
  if (doPrevent) {
    e.preventDefault();
  }
};

metrics.track('Started App');
metrics.track('app heartbeat');
setInterval(function () {
  metrics.track('app heartbeat');
}, 14400000);

router.run(Handler => React.render(<Handler/>, document.body));
SetupStore.setup().then(machine => {
  docker.setup(machine.url, machine.name);
  Menu.setApplicationMenu(Menu.buildFromTemplate(template()));
  ContainerStore.on(ContainerStore.SERVER_ERROR_EVENT, (err) => {
    bugsnag.notify(err);
  });
  ContainerStore.init(function (err) {
    if (err) {
      console.log(err);
      bugsnag.notify('ContainerStoreError', 'Could not init containerstore', {
        error: err,
        machine: machine
      });
    }
    router.transitionTo('containers');
  });
}).catch(err => {
  metrics.track('Setup Failed', {
    step: 'catch',
    message: err.message
  });
  bugsnag.notify('SetupError', 'Setup threw an exception', {
    step: 'catch',
    error: err
  });
  console.log(err);
  console.log(err.stack);
});
