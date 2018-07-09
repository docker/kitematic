import {ipcRenderer, remote} from "electron";
import * as React from "react";
import Router from "react-router";
import repositoryActions from "./renderer/actions/RepositoryActions";
import template from "./renderer/menutemplate";
import routerContainer from "./renderer/router";
import routes from "./renderer/routes.jsx";
import machine from "./renderer/utils/DockerMachineUtil";
import metrics from "./renderer/utils/MetricsUtil";
import setupUtil from "./renderer/utils/SetupUtil";
import docker from "./renderer/utils/DockerUtil";
import hub from "./utils/HubUtil";
import hubUtil from "./utils/HubUtil";
import webUtil from "./utils/WebUtil";

require.main.paths.splice(0, 0, process.env.NODE_PATH);

const Menu = remote.Menu;

hubUtil.init();

if (hubUtil.loggedin()) {
	(repositoryActions as any).repos();
}

(repositoryActions as any).recommended();

webUtil.addWindowSizeSaving();
webUtil.addLiveReload();
webUtil.addBugReporting();
webUtil.disableGlobalBackspace();

Menu.setApplicationMenu(Menu.buildFromTemplate(template() as any));

metrics.track("Started App");
metrics.track("app heartbeat");
setInterval( () => {
	metrics.track("app heartbeat");
}, 14400000);

const router = Router.create({
	routes,
});
router.run((Handler) => (React as any).render(<Handler/>, document.body));
routerContainer.set(router);

setupUtil.setup().then(() => {
	Menu.setApplicationMenu(Menu.buildFromTemplate(template() as any));
	docker.init();
	if (!hub.prompted() && !hub.loggedin()) {
		router.transitionTo("login");
	} else {
		router.transitionTo("search");
	}
}).catch((err) => {
	metrics.track("Setup Failed", {
		message: err.message,
		step: "catch",
	});
	throw err;
});

ipcRenderer.on("application:quitting", async () => {
	docker.detachEvent();
	if (localStorage.getItem("settings.closeVMOnQuit") === "true") {
		await machine.stop();
	}
});

window.onbeforeunload = () => {
	docker.detachEvent();
};
