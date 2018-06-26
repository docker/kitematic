import {remote, shell} from "electron";
import router from "./renderer/router";
import machine from "./utils/DockerMachineUtil";
import docker from "./utils/DockerUtil";
import metrics from "./utils/MetricsUtil";
import util from "./utils/Util";

const app = remote.app;
const window = remote.getCurrentWindow();

// main.js
const MenuTemplate = function() {
	return [
		{
			label: "Kitematic",
			submenu: [
				{
					enabled: !!docker.host,
					label: "About Kitematic",
					click() {
						metrics.track("Opened About", {
							from: "menu",
						});
						router.get().transitionTo("about");
						if (window.isMinimized()) {
							window.restore();
						}
					},
				},
				{
					type: "separator",
				},
				{
					accelerator: util.CommandOrCtrl() + "+,",
					enabled: !!docker.host,
					label: "Preferences",
					click() {
						metrics.track("Opened Preferences", {
							from: "menu",
						});
						router.get().transitionTo("preferences");
						if (window.isMinimized()) {
							window.restore();
						}
					},
				},
				{
					type: "separator",
				},
				{
					type: "separator",
				},
				{
					accelerator: util.CommandOrCtrl() + "+H",
					label: "Hide Kitematic",
					selector: "hide:",
				},
				{
					accelerator: util.CommandOrCtrl() + "+Alt+H",
					label: "Hide Others",
					selector: "hideOtherApplications:",
				},
				{
					label: "Show All",
					selector: "unhideAllApplications:",
				},
				{
					type: "separator",
				},
				{
					accelerator: util.CommandOrCtrl() + "+Q",
					label: "Quit",
					click() {
						app.quit();
					},
				},
			],
		},
		{
			label: "File",
			submenu: [
				{
					type: "separator",
				},
				{
					accelerator: util.CommandOrCtrl() + "+Shift+T",
					enabled: !!docker.host,
					click() {
						metrics.track("Opened Docker Terminal", {
							from: "menu",
						});
						machine.dockerTerminal();
					},
					label: "Open Docker Command Line Terminal",
				},
			],
		},
		{
			label: "Edit",
			submenu: [
				{
					accelerator: util.CommandOrCtrl() + "+Z",
					label: "Undo",
					selector: "undo:",
				},
				{
					accelerator: "Shift+" + util.CommandOrCtrl() + "+Z",
					label: "Redo",
					selector: "redo:",
				},
				{
					type: "separator",
				},
				{
					accelerator: util.CommandOrCtrl() + "+X",
					label: "Cut",
					selector: "cut:",
				},
				{
					accelerator: util.CommandOrCtrl() + "+C",
					label: "Copy",
					selector: "copy:",
				},
				{
					accelerator: util.CommandOrCtrl() + "+V",
					label: "Paste",
					selector: "paste:",
				},
				{
					accelerator: util.CommandOrCtrl() + "+A",
					label: "Select All",
					selector: "selectAll:",
				},
			],
		},
		{
			label: "View",
			submenu: [
				{
					accelerator: util.CommandOrCtrl() + "+R",
					enabled: !!docker.host,
					label: "Refresh Container List",
					click() {
						metrics.track("Refreshed Container List", {
							from: "menu",
						});
						docker.fetchAllContainers();
					},
				},
				{
					accelerator: "Alt+" + util.CommandOrCtrl() + "+I",
					label: "Toggle Chromium Developer Tools",
					click() {
						remote.getCurrentWindow().webContents.toggleDevTools();
					},
				},
			],
		},
		{
			label: "Window",
			submenu: [
				{
					accelerator: util.CommandOrCtrl() + "+M",
					label: "Minimize",
					selector: "performMiniaturize:",
				},
				{
					accelerator: util.CommandOrCtrl() + "+W",
					label: "Close",
					click() {
						remote.getCurrentWindow().hide();
					},
				},
				{
					type: "separator",
				},
				{
					label: "Bring All to Front",
					selector: "arrangeInFront:",
				},
				{
					type: "separator",
				},
				{
					accelerator: "Cmd+0",
					label: "Kitematic",
					click() {
						remote.getCurrentWindow().show();
					},
				},
			],
		},
		{
			label: "Help",
			submenu: [
				{
					label: "Report Issue or Suggest Feedback",
					click() {
						metrics.track("Opened Issue Reporter", {
							from: "menu",
						});
						shell.openExternal("https://github.com/kitematic/kitematic/issues/new");
					},
				},
			],
		},
	];
};

export default MenuTemplate;
module.exports = MenuTemplate;
