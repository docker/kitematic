import {app, BrowserWindow} from "electron";
import {readFileSync} from "fs";
import {platform} from "os";
import {join} from "path";
import {FileResources} from "../common/resources/FileResources";
import {Settings} from "./Settings";

process.env.NODE_PATH = FileResources.NODE_MODULES_PATH;
process.env.RESOURCES_PATH = FileResources.RESOURCES_PATH;
if (process.platform !== "win32") {
	process.env.PATH = "/usr/local/bin:" + process.env.PATH;
}

let size: {height, width} = new Settings();
try {
	size = JSON.parse(readFileSync(join(app.getPath("userData"), "size.json"), "utf8"));
} catch (err) {}

app.on("ready", () => {
	const mainWindow = new BrowserWindow({
		frame: false,
		height: size.height,
		minHeight: platform() === "win32" ? 260 : 500,
		minWidth: platform() === "win32" ? 400 : 700,
		resizable: true,
		show: false,
		width: size.width,
	});

	if (process.env.NODE_ENV === "development") {
		mainWindow.webContents.openDevTools({
			mode: "detach",
		});
	}

	mainWindow.loadFile(FileResources.INDEX_HTML);

	app.on("activate", () => {
		mainWindow.show();
	});

	mainWindow.on("close", (event: Event) => {
		mainWindow.webContents.send("application:quitting");
	});

	mainWindow.webContents.on("new-window", (event: Event) => {
		event.preventDefault();
	});

	mainWindow.webContents.on("will-navigate", (event: Event, url: string) => {
		if (url.indexOf("build/index.html#") < 0) {
			event.preventDefault();
		}
	});

	mainWindow.webContents.on("did-finish-load", () => {
		mainWindow.setTitle("Kitematic");
		mainWindow.show();
		mainWindow.focus();
	});
});
