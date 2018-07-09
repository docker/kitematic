import {Promise as BPromise} from "bluebird";
import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";
import _ from "underscore";
import which from "which";
import util from "../../utils/Util";

export default {
	command() {
		if (util.isWindows()) {
			if (process.env.DOCKER_TOOLBOX_INSTALL_PATH) {
				return path.join(process.env.DOCKER_TOOLBOX_INSTALL_PATH, "docker-machine.exe");
			}
		}

		try {
			return which.sync("docker-machine");
		} catch (ex) {
			return null;
		}
	},
	name() {
		return "default";
	},
	installed() {
		try {
			fs.accessSync(this.command(), (fs as any).X_OK);
			return true;
		} catch (ex) {
			return false;
		}
	},
	async version() {
		return await util.execFile([this.command(), "-v"]).then((stdout: any) => {
			try {
				let matchlist = stdout.match(/(\d+\.\d+\.\d+).*/);
				if (!matchlist || matchlist.length < 2) {
					return Promise.reject("docker-machine -v output format not recognized.");
				}
				return Promise.resolve(matchlist[1]);
			} catch (err) {
				return Promise.resolve(null);
			}
		}).catch(() => {
			return Promise.resolve(null);
		});
	},
	isoversion(machineName = this.name()) {
		try {
			let data = fs.readFileSync(path.join(util.home(), ".docker", "machine", "machines", machineName, "boot2docker.iso"), "utf8");
			let match = data.match(/Boot2Docker-v(\d+\.\d+\.\d+)/);
			if (match) {
				return match[1];
			} else {
				return null;
			}
		} catch (err) {
			return null;
		}
	},
	exists(machineName = this.name()) {
		return this.status(machineName).then(() => {
			return true;
		}).catch(() => {
			return false;
		});
	},
	async create(machineName = this.name()) {
		return await util.execFile([this.command(), "-D", "create", "-d", "virtualbox", "--virtualbox-memory", "2048", machineName]);
	},
	async start(machineName = this.name()) {
		return await util.execFile([this.command(), "-D", "start", machineName]);
	},
	async stop(machineName = this.name()) {
		return await util.execFile([this.command(), "stop", machineName]);
	},
	async upgrade(machineName = this.name()) {
		return await util.execFile([this.command(), "upgrade", machineName]);
	},
	async rm(machineName = this.name()) {
		return await util.execFile([this.command(), "rm", "-f", machineName]);
	},
	async ip(machineName = this.name()) {
		return await util.execFile([this.command(), "ip", machineName]).then((stdout: any) => {
			return Promise.resolve(stdout.trim().replace("\n", ""));
		});
	},
	async url(machineName = this.name()) {
		return await util.execFile([this.command(), "url", machineName]).then((stdout: any) => {
			return Promise.resolve(stdout.trim().replace("\n", ""));
		});
	},
	async regenerateCerts(machineName = this.name()) {
		return await util.execFile([this.command(), "tls-regenerate-certs", "-f", machineName]);
	},
	async status(machineName = this.name()) {
		return await new Promise((resolve, reject) => {
			child_process.execFile(this.command(), ["status", machineName], (error, stdout, stderr) => {
				if (error) {
					reject(new Error("Encountered an error: " + error));
				} else {
					resolve(stdout.trim() + stderr.trim());
				}
			});
		});
	},
	async disk(machineName = this.name()) {
		return await util.execFile([this.command(), "ssh", machineName, "df"]).then((stdout: any) => {
			try {
				let lines = stdout.split("\n");
				let dataline = _.find(lines, function(line) {
					return line.indexOf("/dev/sda1") !== -1;
				});
				let tokens = dataline.split(" ");
				tokens = tokens.filter(function(token) {
					return token !== "";
				});
				let usedGb = parseInt(tokens[2], 10) / 1000000;
				let totalGb = parseInt(tokens[3], 10) / 1000000;
				let percent = parseInt(tokens[4].replace("%", ""), 10);
				return {
					used_gb: usedGb.toFixed(2),
					total_gb: totalGb.toFixed(2),
					percent,
				};
			} catch (err) {
				return Promise.reject(err) as any;
			}
		});
	},
	async memory(machineName = this.name()) {
		return await util.execFile([this.command(), "ssh", machineName, "free -m"]).then((stdout: any) => {
			try {
				let lines = stdout.split("\n");
				let dataline = _.find(lines, function(line) {
					return line.indexOf("-/+ buffers") !== -1;
				});
				let tokens = dataline.split(" ");
				tokens = tokens.filter((token) => {
					return token !== "";
				});
				let usedGb = parseInt(tokens[2], 10) / 1000;
				let freeGb = parseInt(tokens[3], 10) / 1000;
				let totalGb = usedGb + freeGb;
				let percent = Math.round(usedGb / totalGb * 100);
				return {
					used_gb: usedGb.toFixed(2),
					total_gb: totalGb.toFixed(2),
					free_gb: freeGb.toFixed(2),
					percent,
				};
			} catch (err) {
				return Promise.reject(err) as any;
			}
		});
	},
	async dockerTerminal(cmd?, machineName = this.name()) {
		cmd = cmd || process.env.SHELL || "";
		if (util.isWindows()) {
			if (util.isNative()) {
				util.exec("start powershell.exe " + cmd);
			} else {
				this.url(machineName).then((machineUrl) => {
					util.exec("start powershell.exe " + cmd,
						{env: {
								DOCKER_HOST: machineUrl,
								DOCKER_CERT_PATH: process.env.DOCKER_CERT_PATH || path.join(util.home(), ".docker", "machine", "machines", machineName),
								DOCKER_TLS_VERIFY: 1,
							},
						});
				});
			}
		} else {
			let terminal = util.isLinux() ? util.linuxTerminal() : [path.join(process.env.RESOURCES_PATH, "terminal")] as any;
			if (util.isNative()) {
				terminal.push(cmd);
				util.execFile(terminal).then(() => {});
			} else {
				this.url(machineName).then((machineUrl) => {
					terminal.push(`DOCKER_HOST=${machineUrl} DOCKER_CERT_PATH=${process.env.DOCKER_CERT_PATH || path.join(util.home(), ".docker/machine/machines/" + machineName)} DOCKER_TLS_VERIFY=1`);
					terminal.push(cmd);
					util.execFile(terminal).then(() => {});
				});
			}
		}
	},
	virtualBoxLogs(machineName = this.name()): string {
		let logsPath = null;
		if (process.env.MACHINE_STORAGE_PATH) {
			logsPath = path.join(process.env.MACHINE_STORAGE_PATH, "machines", machineName, machineName, "Logs", "VBox.log");
		} else {
			logsPath = path.join(util.home(), ".docker", "machine", "machines", machineName, machineName, "Logs", "VBox.log");
		}

		let logData = null;
		try {
			logData = fs.readFileSync(logsPath, "utf8");
		} catch (e) {
			console.error(e);
		}
		return logData;
	},
};
