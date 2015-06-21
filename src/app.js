require.main.paths.splice(0, 0, process.env.NODE_PATH);
var remote = require('remote');
var Menu = remote.require('menu');
var React = require('react');
var ipc = require('ipc');
var machine = require('./utils/DockerMachineUtil');
var metrics = require('./utils/MetricsUtil');
var router = require('./router');
var template = require('./menutemplate');
var webUtil = require('./utils/WebUtil');
var hubUtil = require('./utils/HubUtil');
var urlUtil = require ('./utils/URLUtil');
var app = remote.require('app');
var request = require('request');
var hub = require('./utils/HubUtil');
var Router = require('react-router');
var routes = require('./routes');
var routerContainer = require('./router');
var repositoryActions = require('./actions/RepositoryActions');

hubUtil.init();

if (hubUtil.loggedin()) {
  repositoryActions.repos();
}

repositoryActions.recommended();

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

var router = Router.create({
  routes: routes
});
router.run(Handler => React.render(<Handler/>, document.body));
routerContainer.set(router);

// Set up app main menu
Menu.setApplicationMenu(Menu.buildFromTemplate(template()));

if (!hub.prompted() && !hub.loggedin()) {
  router.transitionTo('login');
} else {
  router.transitionTo('search');
}

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
    if (!flags) {
      return;
    }

    urlUtil.openUrl(opts.url, flags, app.getVersion());
  });
});

module.exports = {
  router: router
};
