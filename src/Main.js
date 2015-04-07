require.main.paths.splice(0, 0, process.env.NODE_PATH);
var remote = require('remote');
var ContainerStore = require('./ContainerStore');
var Menu = remote.require('menu');
var React = require('react');
var SetupStore = require('./SetupStore');
var bugsnag = require('bugsnag-js');
var ipc = require('ipc');
var machine = require('./DockerMachine');
var metrics = require('./Metrics');
var router = require('./Router');
var template = require('./MenuTemplate');
var webUtil = require('./WebUtil');

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

ipc.on('application:quitting', opts => {
  if (!opts.updating && localStorage.getItem('settings.closeVMOnQuit') === 'true') {
    machine.stop();
  }
});

ipc.on('application:open-url', opts => {
  console.log('Creating container from protocol');
  var parser = document.createElement('a');
  parser.href = opts.url;

  if (parser.protocol !== 'docker:') {
    return;
  }

  var pathname = parser.pathname.replace('//', '');
  var slash = pathname.indexOf('/');
  var base = pathname.slice(0, slash);

  if (base === 'runRepo') {
    var repo = pathname.substring(slash + 1);
    ContainerStore.setPending(repo, 'latest');
  }
});
ContainerStore.setPending('kitematic/ghost', 'latest');

SetupStore.setup().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template()));
  ContainerStore.on(ContainerStore.SERVER_ERROR_EVENT, (err) => {
    bugsnag.notify(err);
  });
  ContainerStore.init(function () {
    router.transitionTo('containers');
  });
}).catch(err => {
  metrics.track('Setup Failed', {
    step: 'catch',
    message: err.message
  });
  console.log(err);
  bugsnag.notify(err);
});
