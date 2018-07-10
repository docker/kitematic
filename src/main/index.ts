import {Promise as BlueBirdPromise} from "bluebird";
import {app, BrowserWindow} from "electron";
import {readFileSync} from "fs";
import {platform} from "os";
import {join, normalize} from "path";
import {FileResources} from "../common/resources/FileResources";

process.env.NODE_PATH = FileResources.NODE_MODULES_PATH;
process.env.RESOURCES_PATH = FileResources.RESOURCES_PATH;
if (process.platform !== "win32") {
	process.env.PATH = "/usr/local/bin:" + process.env.PATH;
}
let exiting = false;
let size: {height, width} = {} as any;
try {
	size = JSON.parse(readFileSync(join(app.getPath("userData"), "size"), "utf8"));
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
		mainWindow.webContents.openDevTools({
			mode: "detach",
		});
	}

	mainWindow.loadFile(FileResources.INDEX_HTML);
	// mainWindow.loadURL(normalize(`file://${FileResources.INDEX}`));

	app.on("activate", () => {
		mainWindow.show();
	});

	if (platform() === "win32" || platform() === "linux") {
		mainWindow.on("close", (event: Event) => {
			mainWindow.webContents.send("application:quitting");
			if (!exiting) {
				BlueBirdPromise.delay(1000).then(() => {
					mainWindow.close();
				});
				exiting = true;
				event.preventDefault();
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
