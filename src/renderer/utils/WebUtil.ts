import {remote} from "electron";
const app = remote.app;
import bugsnag from "bugsnag-js";
import * as fs from "fs";
import * as path from "path";
import util from "../../utils/Util";
import metrics from "./MetricsUtil";

export default {
  addWindowSizeSaving() {
	window.addEventListener("resize", function() {
		fs.writeFileSync(path.join(app.getPath("userData"), "size"), JSON.stringify({
		width: window.outerWidth,
		height: window.outerHeight,
		}));
	});
  },
  addLiveReload() {
	if (process.env.NODE_ENV === "development") {
		let head = document.getElementsByTagName("head")[0];
		let script = document.createElement("script");
		script.type = "text/javascript";
		script.src = "http://localhost:35729/livereload.js";
		head.appendChild(script);
	}
  },
  addBugReporting() {
	let settingsjson = util.settingsjson() as any;

	if (settingsjson.bugsnag) {
		bugsnag.apiKey = settingsjson.bugsnag;
		bugsnag.autoNotify = true;
		bugsnag.releaseStage = process.env.NODE_ENV === "development" ? "development" : "production";
		bugsnag.notifyReleaseStages = ["production"];
		bugsnag.appVersion = app.getVersion();

		bugsnag.beforeNotify = function(payload) {
		if (!metrics.enabled()) {
			return false;
		}

		payload.stacktrace = util.removeSensitiveData(payload.stacktrace);
		payload.context = util.removeSensitiveData(payload.context);
		payload.file = util.removeSensitiveData(payload.file);
		payload.message = util.removeSensitiveData(payload.message);
		payload.url = util.removeSensitiveData(payload.url);
		payload.name = util.removeSensitiveData(payload.name);
		payload.file = util.removeSensitiveData(payload.file);

		for (let key in payload.metaData) {
			payload.metaData[key] = util.removeSensitiveData(payload.metaData[key]);
		}
		};
	}
  },
  disableGlobalBackspace() {
	document.onkeydown = function(e: any) {
		e = e || window.event;
		let doPrevent;
		if (e.keyCode === 8) {
		let d: any = e.srcElement || e.target;
		if (d.tagName.toUpperCase() === "INPUT" || d.tagName.toUpperCase() === "TEXTAREA") {
			doPrevent = d.readOnly || d.disabled;
		} else {
			doPrevent = true;
		}
		} else {
		doPrevent = false;
		}
		if (doPrevent) {
		e.preventDefault();
		}
	};
  },
};
