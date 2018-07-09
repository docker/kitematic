var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ipcRenderer, remote } from "electron";
import * as React from "react";
import Router from "react-router";
import repositoryActions from "./renderer/actions/RepositoryActions";
import template from "./renderer/menutemplate";
import routerContainer from "./renderer/router";
import routes from "./renderer/routes.jsx";
import machine from "./renderer/utils/DockerMachineUtil";
import docker from "./renderer/utils/DockerUtil";
import metrics from "./renderer/utils/MetricsUtil";
import setupUtil from "./renderer/utils/SetupUtil";
import hub from "./utils/HubUtil";
import hubUtil from "./utils/HubUtil";
import webUtil from "./utils/WebUtil";
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
metrics.track("Started App");
metrics.track("app heartbeat");
setInterval(() => {
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
        message: err.message,
        step: "catch",
    });
    throw err;
});
ipcRenderer.on("application:quitting", () => __awaiter(this, void 0, void 0, function* () {
    docker.detachEvent();
    if (localStorage.getItem("settings.closeVMOnQuit") === "true") {
        yield machine.stop();
    }
}));
window.onbeforeunload = () => {
    docker.detachEvent();
};
//# sourceMappingURL=app.jsx.map