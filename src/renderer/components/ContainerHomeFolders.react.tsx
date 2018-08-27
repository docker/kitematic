import {shell} from "electron";
import {remote} from "electron";
import mkdirp from "mkdirp";
import * as path from "path";
import React from "react/addons";
import _ from "underscore";
import containerActions from "../actions/ContainerActions";
import {ImageResources} from "../resources/ImageResources";
import metrics from "../utils/MetricsUtil";
import util from "../utils/Util";
const dialog = remote.dialog;

export default React.createClass({
	contextTypes: {
		router: React.PropTypes.func,
	},
	handleClickFolder(source, destination) {
		metrics.track("Opened Volume Directory", {
			from: "home",
		});

		if (source.indexOf(util.windowsToLinuxPath(util.home())) === -1) {
			dialog.showMessageBox({
				message: `Enable all volumes to edit files? This may not work with all database containers.`,
				buttons: ["Enable Volumes", "Cancel"],
			}, (index) => {
				if (index === 0) {
					let mounts = _.clone(this.props.container.Mounts);
					let newSource = path.join(util.home(), util.documents(), "Kitematic", this.props.container.Name, destination);

					mounts.forEach((m) => {
						if (m.Destination === destination) {
							m.Source = util.windowsToLinuxPath(newSource);
							m.Driver = null;
						}
					});

					mkdirp(newSource, function(err) {
						console.log(err);
						if (!err) {
							shell.showItemInFolder(newSource);
						}
					});

					let binds = mounts.map((m) => {
						return m.Source + ":" + m.Destination;
					});

					let hostConfig = _.extend(this.props.container.HostConfig, {Binds: binds});

					containerActions.update(this.props.container.Name, {Mounts: mounts, HostConfig: hostConfig});
				}
			});
		} else {
			let path = util.isWindows() ? util.linuxToWindowsPath(source) : source;
			shell.showItemInFolder(path);
		}
	},
	handleClickChangeFolders() {
		metrics.track("Viewed Volume Settings", {
			from: "preview",
		});
		this.context.router.transitionTo("containerSettingsVolumes", {name: this.context.router.getCurrentParams().name});
	},
	render() {
		if (!this.props.container) {
			return false;
		}

		let folders = _.map(this.props.container.Mounts, (m, i) => {
			let destination = m.Destination;
			let source = m.Source;
			return (
				<div key={i} className="folder" onClick={this.handleClickFolder.bind(this, source, destination)}>
					<img src={ImageResources.FOLDER} />
					<div className="text">{destination}</div>
				</div>
			);
		});

		return (
			<div className="folders wrapper">
				<div className="widget">
					<div className="top-bar">
						<div className="text">Volumes</div>
						<div className="action" onClick={this.handleClickChangeFolders}>
							<span className="icon icon-preferences"></span>
						</div>
					</div>
					<div className="folders-list">
						{folders}
					</div>
				</div>
			</div>
		);
	},
});
