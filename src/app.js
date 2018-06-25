import {ipcRenderer,remote} from "electron";
import React from 'react';
import metrics from './utils/MetricsUtil';
import template from './menutemplate';
import webUtil from './utils/WebUtil';
import hubUtil from './utils/HubUtil';
import setupUtil from './utils/SetupUtil';
import docker from './utils/DockerUtil';
import hub from './utils/HubUtil';
import Router from 'react-router';
import routes from './routes';
import routerContainer from './router';
import repositoryActions from './actions/RepositoryActions';
import machine from './utils/DockerMachineUtil';

require.main.paths.splice(0, 0, process.env.NODE_PATH);

const Menu = remote.Menu;

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
setInterval( () => {
  metrics.track('app heartbeat');
}, 14400000);

const router = Router.create({
    routes: routes
});
router.run(Handler => React.render(<Handler/>, document.body));
routerContainer.set(router);



setupUtil.setup().then(() => {
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


ipcRenderer.on('application:quitting', () => {
  docker.detachEvent();
  if (localStorage.getItem('settings.closeVMOnQuit') === 'true') {
    machine.stop();
  }
});

window.onbeforeunload = ()=> {
  docker.detachEvent();
};
