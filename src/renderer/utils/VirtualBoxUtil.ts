import * as fs from "fs";
import * as path from "path";
import util from "./Util";

export default {
  command() {
	if (util.isWindows()) {
		if (process.env.VBOX_MSI_INSTALL_PATH) {
		return path.join(process.env.VBOX_MSI_INSTALL_PATH, "VBoxManage.exe");
		} else {
		return path.join(process.env.VBOX_INSTALL_PATH, "VBoxManage.exe");
		}
	} else {
		return "/Applications/VirtualBox.app/Contents/MacOS/VBoxManage";
	}
  },
  installed() {
	if (util.isWindows() && !process.env.VBOX_INSTALL_PATH && !process.env.VBOX_MSI_INSTALL_PATH) {
		return false;
	}
	return fs.existsSync(this.command());
  },
  active() {
	return fs.existsSync("/dev/vboxnetctl");
  },
  version() {
	return util.execFile([this.command(), "-v"]).then((stdout: any) => {
		let matchlist = stdout.match(/(\d+\.\d+\.\d+).*/);
		if (!matchlist || matchlist.length < 2) {
		Promise.reject("VBoxManage -v output format not recognized.");
		}
		return Promise.resolve(matchlist[1]);
	}).catch(() => {
		return Promise.resolve(null);
	});
  },
  mountSharedDir(vmName, pathName, hostPath) {
	return util.execFile([this.command(), "sharedfolder", "add", vmName, "--name", pathName, "--hostpath", hostPath, "--automount"]);
  },
  vmExists(name) {
	return util.execFile([this.command(), "list", "vms"]).then((out: any) => {
		return out.indexOf('"' + name + '"') !== -1;
	}).catch(() => {
		return false;
	});
  },
};
