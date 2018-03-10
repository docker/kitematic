import { ipcRenderer, Menu } from "electron";
require.main.paths.splice(0, 0, process.env.NODE_PATH);
import * as React from "react";
import Router from "react-router";
import repositoryActions from "./actions/RepositoryActions";
import template from "./menutemplate";
import routerContainer from "./router";
import routes from "./routes";
import machine from "./utils/DockerMachineUtil";
import docker from "./utils/DockerUtil";
import hubUtil from "./utils/HubUtil";
import hub from "./utils/HubUtil";
import metrics from "./utils/MetricsUtil";
import setupUtil from "./utils/SetupUtil";
import webUtil from "./utils/WebUtil";
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
metrics.track("Started App");
metrics.track("app heartbeat");
setInterval(function () {
    metrics.track("app heartbeat");
}, 14400000);
const router = Router.create({
    routes,
});
router.run((Handler) => React.render(<Handler />, document.body));
routerContainer.set(router);
setupUtil.setup().then(() => {
    Menu.setApplicationMenu(Menu.buildFromTemplate(template()));
    docker.init();
    if (!hub.prompted() && !hub.loggedin()) {
        router.transitionTo("login");
    }
    else {
        router.transitionTo("search");
    }
}).catch((err) => {
    metrics.track("Setup Failed", {
        step: "catch",
        message: err.message,
    });
    throw err;
});
ipcRenderer.on("application:quitting", () => {
    docker.detachEvent();
    if (localStorage.getItem("settings.closeVMOnQuit") === "true") {
        machine.stop();
    }
});
window.onbeforeunload = function () {
    docker.detachEvent();
};
//# sourceMappingURL=app.jsx.map