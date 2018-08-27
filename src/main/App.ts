import {app, BrowserWindow} from "electron";
import {readFileSync} from "fs";
import {platform} from "os";
import {join} from "path";
import {FileResources} from "../common/resources/FileResources";
import {Settings} from "./Settings";

export class App {

	private static mainWindow: BrowserWindow;

	public static onAppReady() {
		let size = new Settings();
		try {
			size = JSON.parse(readFileSync(join(app.getPath("userData"), "size.json"), "utf8"));
		} catch (err) {}

		App.mainWindow = new BrowserWindow({
			frame: false,
			height: size.height,
			minHeight: platform() === "win32" ? 260 : 500,
			minWidth: platform() === "win32" ? 400 : 700,
			resizable: true,
			show: false,
			width: size.width,
		});

		if (process.env.NODE_ENV === "development") {
			App.mainWindow.webContents.openDevTools({
				mode: "detach",
			});
		}

		app.on("activate", App.onAppActivate);
		App.mainWindow.on("close", App.onMainWindowClose);
		App.mainWindow.webContents.on("new-window", App.onWebContentsNewWindow);
		App.mainWindow.webContents.on("will-navigate", App.onWebContentsWillNavigate);
		App.mainWindow.webContents.on("did-finish-load", App.onWebContentsDidFinishLoad);
		App.mainWindow.loadFile(FileResources.INDEX_HTML);
	}

	private static onAppActivate() {
		App.mainWindow.show();
	}

	private static onMainWindowClose(event: Event) {
		App.mainWindow.webContents.send("application:quitting");
	}

	private static onWebContentsDidFinishLoad() {
		App.mainWindow.setTitle("Kitematic");
		App.mainWindow.show();
		App.mainWindow.focus();
	}

	private static onWebContentsNewWindow(event: Event) {
		event.preventDefault();
	}

	private static onWebContentsWillNavigate(event: Event, url: string) {
		if (url.indexOf("build/index.html#") < 0) {
			event.preventDefault();
		}
	}

}
