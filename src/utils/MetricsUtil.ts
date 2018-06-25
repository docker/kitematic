import * as fs from "fs";
import Mixpanel from "mixpanel";
import uuid from "node-uuid";
import assign from "object-assign";
import * as os from "os";
import osxRelease from "osx-release";
import * as path from "path";
import util from "./Util";
let settings;

try {
  settings = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "settings.json"), "utf8"));
} catch (err) {
  settings = {};
}

let token = process.env.NODE_ENV === "development" ? settings["mixpanel-dev"] : settings.mixpanel;
if (!token) {
  token = "none";
}

let mixpanel = Mixpanel.init(token);

if (localStorage.getItem("metrics.enabled") === null) {
  localStorage.setItem("metrics.enabled", true as any);
}

export default {
  enabled() {
	return localStorage.getItem("metrics.enabled") === "true";
  },
  setEnabled(enabled) {
	localStorage.setItem("metrics.enabled", !!enabled as any);
  },
  track(name, data?) {
	data = data || {};
	if (!name) {
		return;
	}

	if (localStorage.getItem("metrics.enabled") !== "true") {
		return;
	}

	let id = localStorage.getItem("metrics.id");
	if (!id) {
		id = uuid.v4();
		localStorage.setItem("metrics.id", id);
	}

	let osName = os.platform();
	let osVersion = util.isWindows() ? os.release() : osxRelease(os.release()).version;

	mixpanel.track(name, assign({
		"distinct_id": id,
		"version": util.packagejson().version,
		"Operating System": osName,
		"Operating System Version": osVersion,
		"Operating System Architecture": os.arch(),
	}, data));
  },

};
