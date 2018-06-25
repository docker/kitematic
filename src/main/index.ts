import {Promise} from "bluebird";
import {app, BrowserWindow} from "electron";
import {readFileSync} from "fs";
import {platform} from "os";
import {join, normalize} from "path";

process.env.NODE_PATH = join(__dirname, "../node_modules");
process.env.RESOURCES_PATH = join(__dirname, "/../resources");
if (process.platform !== "win32") {
	process.env.PATH = "/usr/local/bin:" + process.env.PATH;
}
let exiting = false;
let size: {height, width} = {} as any;
let settingsjson: {} = {} as any;
try {
	size = JSON.parse(readFileSync(join(app.getPath("userData"), "size"), "utf8"));
} catch (err) {}

try {
	settingsjson = JSON.parse(readFileSync(join(__dirname, "settings.json"), "utf8"));
} catch (err) {}

app.on("ready", () => {
	const mainWindow = new BrowserWindow({
		frame: false,
		height: size.height || 680,
		minHeight: platform() === "win32" ? 260 : 500,
		minWidth: platform() === "win32" ? 400 : 700,
		resizable: true,
		show: false,
		width: size.width || 1080,
	});

	if (process.env.NODE_ENV === "development") {
		mainWindow.webContents.openDevTools({mode: "detach"});
	}

	mainWindow.loadURL(normalize("file://" + join(__dirname, "../index.html")));

	app.on("activate", () => {
		if (mainWindow) {
			mainWindow.show();
		}
		return false;
	});

	if (platform() === "win32" || platform() === "linux") {
		mainWindow.on("close", (e) => {
			mainWindow.webContents.send("application:quitting");
			if (!exiting) {
				Promise.delay(1000).then(function() {
					mainWindow.close();
				});
				exiting = true;
				e.preventDefault();
			}
		});

		app.on("window-all-closed", () => {
			app.quit();
		});
	} else if (platform() === "darwin") {
		app.on("before-quit", () => {
			mainWindow.webContents.send("application:quitting");
		});
	}

	mainWindow.webContents.on("new-window", (e) => {
		e.preventDefault();
	});

	mainWindow.webContents.on("will-navigate", (e, url) => {
		if (url.indexOf("build/index.html#") < 0) {
			e.preventDefault();
		}
	});

	mainWindow.webContents.on("did-finish-load", () => {
		mainWindow.setTitle("Kitematic");
		mainWindow.show();
		mainWindow.focus();
	});
});
