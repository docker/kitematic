require.main.paths.splice(0, 0, process.env.NODE_PATH);
import remote from 'remote';
var Menu = remote.require('menu');
import React from 'react';
import SetupStore from './stores/SetupStore';
import ipc from 'ipc';
import machine from './utils/DockerMachineUtil';
import metrics from './utils/MetricsUtil';
import template from './menutemplate';
import webUtil from './utils/WebUtil';
import hubUtil from './utils/HubUtil';
var urlUtil = require('./utils/URLUtil');
var app = remote.require('app');
import request from 'request';
import docker from './utils/DockerUtil';
import hub from './utils/HubUtil';
import Router from 'react-router';
import routes from './routes';
import routerContainer from './router';
import repositoryActions from './actions/RepositoryActions';

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

SetupStore.setup().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template()));
  docker.init();
  if (!hub.prompted() && !hub.loggedin()) {
    router.transitionTo('login');
  } else {
    router.transitionTo('search');
  }
}).catch(err => {
  metrics.track('Setup Failed', {
    step: 'catch',
    message: err.message
  });
  throw err;
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
    if (!flags) {
      return;
    }

    urlUtil.openUrl(opts.url, flags, app.getVersion());
  });
});

module.exports = {
  router: router
};
