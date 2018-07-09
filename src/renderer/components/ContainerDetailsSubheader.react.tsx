import classNames from "classnames";
import {shell} from "electron";
import React from "react/addons";
import _ from "underscore";
import ContainerUtil from "../../utils/ContainerUtil";
import dockerMachineUtil from "../../utils/DockerMachineUtil";
import containerActions from "../actions/ContainerActions";
import metrics from "../utils/MetricsUtil";

export default React.createClass({
	contextTypes: {
		router: React.PropTypes.func,
	},
	disableRun() {
		if (!this.props.container) {
			return true;
		}
		return (!this.props.container.State.Running || !this.props.defaultPort || this.props.container.State.Updating);
	},
	disableRestart() {
		if (!this.props.container) {
			return true;
		}
		return (this.props.container.State.Stopping || this.props.container.State.Downloading || this.props.container.State.Restarting || this.props.container.State.Updating);
	},
	disableStop() {
		if (!this.props.container) {
			return true;
		}
		return (this.props.container.State.Stopping || this.props.container.State.Downloading || this.props.container.State.ExitCode || !this.props.container.State.Running || this.props.container.State.Updating);
	},
	disableStart() {
		if (!this.props.container) {
			return true;
		}
		return (this.props.container.State.Downloading || this.props.container.State.Running || this.props.container.State.Updating);
	},
	disableTerminal() {
		if (!this.props.container) {
			return true;
		}
		return (this.props.container.State.Stopping || !this.props.container.State.Running || this.props.container.State.Updating);
	},
	disableTab() {
		if (!this.props.container) {
			return false;
		}
		return (this.props.container.State.Downloading);
	},
	showHome() {
		if (!this.disableTab()) {
			metrics.track("Viewed Home", {
				from: "header",
			});
			this.context.router.transitionTo("containerHome", {name: this.context.router.getCurrentParams().name});
		}
	},
	showSettings() {
		if (!this.disableTab()) {
			metrics.track("Viewed Settings");
			this.context.router.transitionTo("containerSettings", {name: this.context.router.getCurrentParams().name});
		}
	},
	handleRun() {
		if (this.props.defaultPort && !this.disableRun()) {
			metrics.track("Opened In Browser", {
				from: "header",
			});
			shell.openExternal(this.props.ports[this.props.defaultPort].url);
		}
	},
	handleRestart() {
		if (!this.disableRestart()) {
			metrics.track("Restarted Container");
			containerActions.restart(this.props.container.Name);
		}
	},
	handleStop() {
		if (!this.disableStop()) {
			metrics.track("Stopped Container");
			containerActions.stop(this.props.container.Name);
		}
	},
	handleStart() {
		if (!this.disableStart()) {
			metrics.track("Started Container");
			containerActions.start(this.props.container.Name);
		}
	},
	handleDocs() {
		let repoUri = "https://hub.docker.com/r/";
		let imageName = this.props.container.Config.Image.split(":")[0];
		if (imageName.indexOf("/") === -1) {
			repoUri = repoUri + "library/" + imageName;
		} else {
			repoUri = repoUri + imageName;
		}
		shell.openExternal(repoUri);
	},
	handleTerminal() {
		if (!this.disableTerminal()) {
			metrics.track("Terminaled Into Container");
			let container = this.props.container;
			let shell = ContainerUtil.env(container).reduce((envs, env) => {
				envs[env[0]] = env[1];
				return envs;
			}, {}).SHELL;

			if (!shell) {
				shell = localStorage.getItem("settings.terminalShell") || "sh";
			}
			dockerMachineUtil.dockerTerminal(`docker exec -it ${this.props.container.Name} ${shell}`);
		}
	},
	render() {
		let restartActionClass = classNames({
			action: true,
			disabled: this.disableRestart(),
		});
		let stopActionClass = classNames({
			action: true,
			disabled: this.disableStop(),
		});
		let startActionClass = classNames({
			action: true,
			disabled: this.disableStart(),
		});
		let terminalActionClass = classNames({
			action: true,
			disabled: this.disableTerminal(),
		});
		let docsActionClass = classNames({
			action: true,
			disabled: false,
		});

		let currentRoutes = _.map(this.context.router.getCurrentRoutes(), (r) => r.name);
		let currentRoute = _.last(currentRoutes);

		let tabHomeClasses = classNames({
			"details-tab": true,
			"active": currentRoute === "containerHome",
			"disabled": this.disableTab(),
		});
		let tabSettingsClasses = classNames({
			"details-tab": true,
			"active": currentRoutes && (currentRoutes.indexOf("containerSettings") >= 0),
			"disabled": this.disableTab(),
		});
		let startStopToggle;
		if (this.disableStop()) {
			startStopToggle = (
				<div className={startActionClass}>
					<div className="action-icon start" onClick={this.handleStart}><span className="icon icon-start"></span></div>
					<div className="btn-label">START</div>
				</div>
			);
		} else {
			startStopToggle = (
				<div className={stopActionClass}>
					<div className="action-icon stop" onClick={this.handleStop}><span className="icon icon-stop"></span></div>
					<div className="btn-label">STOP</div>
				</div>
			);
		}

		return (
			<div className="details-subheader">
				<div className="details-header-actions">
					{startStopToggle}
					<div className={restartActionClass}>
						<div className="action-icon" onClick={this.handleRestart}><span className="icon icon-restart"></span></div>
						<div className="btn-label">RESTART</div>
					</div>
					<div className={terminalActionClass}>
						<div className="action-icon" onClick={this.handleTerminal}><span className="icon icon-docker-exec"></span></div>
						<div className="btn-label">EXEC</div>
					</div>
					<div className={docsActionClass}>
						<div className="action-icon" onClick={this.handleDocs}><span className="icon icon-open-external"></span></div>
						<div className="btn-label">DOCS</div>
					</div>
				</div>
				<div className="details-subheader-tabs">
					<span className={tabHomeClasses} onClick={this.showHome}>Home</span>
					<span className={tabSettingsClasses} onClick={this.showSettings}>Settings</span>
				</div>
			</div>
		);
	},
});
