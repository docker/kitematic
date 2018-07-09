import {remote} from "electron";
import {shell} from "electron";
import React from "react/addons";
import _ from "underscore";
import metrics from "../../utils/MetricsUtil";
import util from "../../utils/Util";
import containerActions from "../actions/ContainerActions";
const dialog = remote.dialog;

export default React.createClass({
	handleChooseVolumeClick(dockerVol) {
		dialog.showOpenDialog({properties: ["openDirectory", "createDirectory"]}, (filenames) => {
			if (!filenames) {
				return;
			}

			let directory = filenames[0];

			if (!directory || (!util.isNative() && directory.indexOf(util.home()) === -1)) {
				dialog.showMessageBox({
					type: "warning",
					buttons: ["OK"],
					message: "Invalid directory - Please make sure the directory exists and you can read/write to it.",
				});
				return;
			}

			metrics.track("Choose Directory for Volume");

			let mounts = _.clone(this.props.container.Mounts);
			_.each(mounts, (m) => {
				if (m.Destination === dockerVol) {
					m.Source = util.windowsToLinuxPath(directory);
					m.Driver = null;
				}
			});

			let binds = mounts.map((m) => {
				return m.Source + ":" + m.Destination;
			});

			let hostConfig = _.extend(this.props.container.HostConfig, {Binds: binds});

			containerActions.update(this.props.container.Name, {Mounts: mounts, HostConfig: hostConfig});
		});
	},
	handleRemoveVolumeClick(dockerVol) {
		metrics.track("Removed Volume Directory", {
			from: "settings",
		});

		let mounts = _.clone(this.props.container.Mounts);
		_.each(mounts, (m) => {
			if (m.Destination === dockerVol) {
				m.Source = null;
				m.Driver = "local";
			}
		});

		let binds = mounts.map((m) => {
			return m.Source + ":" + m.Destination;
		});

		let hostConfig = _.extend(this.props.container.HostConfig, {Binds: binds});

		containerActions.update(this.props.container.Name, {Mounts: mounts, HostConfig: hostConfig});
	},
	handleOpenVolumeClick(path) {
		metrics.track("Opened Volume Directory", {
			from: "settings",
		});
		if (util.isWindows()) {
			shell.showItemInFolder(util.linuxToWindowsPath(path));
		} else {
			shell.showItemInFolder(path);
		}
	},
	render() {
		if (!this.props.container) {
			return false;
		}

		let homeDir = util.isWindows() ? util.windowsToLinuxPath(util.home()) : util.home();
		let mounts = _.map(this.props.container.Mounts, (m, i) => {
			let source = m.Source, destination = m.Destination;
			if (!m.Source || (!util.isNative() && m.Source.indexOf(homeDir) === -1) || (m.Source.indexOf("/var/lib/docker/volumes") !== -1)) {
				source = (
					<span className="value-right">No Folder</span>
				);
			} else {
				let local = util.isWindows() ? util.linuxToWindowsPath(source) : source;
				source = (
					<a className="value-right" onClick={this.handleOpenVolumeClick.bind(this, source)}>{local.replace(process.env.HOME, "~")}</a>
				);
			}
			return (
				<tr>
					<td>{destination}</td>
					<td>{source}</td>
					<td>
						<button className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleChooseVolumeClick.bind(this, destination)}>Change</button>
						<button className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleRemoveVolumeClick.bind(this, destination)}>Remove</button>
					</td>
				</tr>
			);
		});
		return (
			<div className="settings-panel">
				<div className="settings-section">
					<h3>Configure Volumes</h3>
					<table className="table volumes">
						<thead>
						<tr>
							<th>DOCKER FOLDER</th>
							<th>LOCAL FOLDER</th>
							<th></th>
						</tr>
						</thead>
						<tbody>
						{mounts}
						</tbody>
					</table>
				</div>
			</div>
		);
	},
});
