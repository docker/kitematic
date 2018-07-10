import {app} from "electron";
import {FileResources} from "../common/resources/FileResources";
import {App} from "./App";

process.env.NODE_PATH = FileResources.NODE_MODULES_PATH;
process.env.RESOURCES_PATH = FileResources.RESOURCES_PATH;
if (process.platform !== "win32") {
	process.env.PATH = "/usr/local/bin:" + process.env.PATH;
}

app.on("ready", App.onAppReady);
