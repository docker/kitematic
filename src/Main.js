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
  var repoRegexp = /[a-z0-9]+(?:[._-][a-z0-9]+)*/;
  var tagRegexp = /[\w][\w.-]{0,127}/;
  var parser = document.createElement('a');
  parser.href = opts.url;

  if (parser.protocol !== 'docker:') {
    return;
  }

  var pathname = parser.pathname.replace('//', '');
  var tokens = pathname.split('/');
  var type = tokens[0];
  var repo = tokens.slice(1).join('/');
  var tag = parser.tag || 'latest';

  if (repo.indexOf('/') !== -1 || !repoRegexp.test(repo) || !tagRegexp.test(tag)) {
    return;
  }

  if (type === 'repository') {
    ContainerStore.setPending(repo, tag);
  }
});

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
