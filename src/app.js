require.main.paths.splice(0, 0, process.env.NODE_PATH);
var remote = require('remote');
var ContainerStore = require('./stores/ContainerStore');
var Menu = remote.require('menu');
var React = require('react');
var SetupStore = require('./stores/SetupStore');
var bugsnag = require('bugsnag-js');
var ipc = require('ipc');
var machine = require('./utils/DockerMachineUtil');
var metrics = require('./utils/MetricsUtil');
var router = require('./router');
var template = require('./menutemplate');
var webUtil = require('./utils/WebUtil');
var urlUtil = require ('./utils/URLUtil');
var app = remote.require('app');
var request = require('request');

webUtil.addWindowSizeSaving();
webUtil.addLiveReload();
webUtil.addBugReporting();
webUtil.disableGlobalBackspace();

Menu.setApplicationMenu(Menu.buildFromTemplate(template()));

metrics.track('Started App');
metrics.track('app heartbeat');
setInterval(function () {
  metrics.track('app heartbeat');
}, 14400000);

router.run(Handler => React.render(<Handler/>, document.body));

SetupStore.setup().then(() => {
  if (ContainerStore.pending()) {
    router.transitionTo('pull');
  } else {
    router.transitionTo('new');
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(template()));
  ContainerStore.on(ContainerStore.SERVER_ERROR_EVENT, (err) => {
    bugsnag.notify(err);
  });
  ContainerStore.init(function () {});
}).catch(err => {
  metrics.track('Setup Failed', {
    step: 'catch',
    message: err.message
  });
  console.log(err);
  bugsnag.notify(err);
});

ipc.on('application:quitting', () => {
  if (localStorage.getItem('settings.closeVMOnQuit') === 'true') {
    machine.stop();
  }
});

// Event fires when the app receives a docker:// URL such as
// docker://repository/run/redis
ipc.on('application:open-url', opts => {
  request.get('https://kitematic.com/flags.json', (err, response, body) => {
    if (err || response.statusCode !== 200) {
      return;
    }
    var flags = JSON.parse(body);
    urlUtil.openUrl(opts.url, flags, app.getVersion());
  });
});
