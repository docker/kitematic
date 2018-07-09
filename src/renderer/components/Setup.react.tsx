import {shell} from "electron";
import RetinaImage from "react-retina-image";
import Router from "react-router";
import React from "react/addons";
import setupActions from "../../actions/SetupActions";
import metrics from "../../utils/MetricsUtil";
import util from "../../utils/Util";
import setupStore from "../stores/SetupStore";
import Header from "./Header.react.jsx";
import Radial from "./Radial.react.jsx";

export default React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
		return setupStore.getState();
	},

	componentDidMount() {
		setupStore.listen(this.update);
	},

	componentWillUnmount() {
		setupStore.unlisten(this.update);
	},

	update() {
		this.setState(setupStore.getState());
	},

	handleErrorRetry() {
		setupActions.retry(false);
	},

	handleUseVbox() {
		setupActions.useVbox();
	},

	handleErrorRemoveRetry() {
		console.log("Deleting VM and trying again." );
		setupActions.retry(true);
	},

	handleResetSettings() {
		metrics.track("Settings reset", {
			from: "setup",
		});
		localStorage.removeItem("settings.useVM");
		setupActions.retry(false);
	},

	handleToolBox() {
		metrics.track("Getting toolbox", {
			from: "setup",
		});
		shell.openExternal("https://www.docker.com/docker-toolbox");
	},

	handleLinuxDockerInstall() {
		metrics.track("Opening Linux Docker installation instructions", {
			from: "setup",
		});
		shell.openExternal("http://docs.docker.com/linux/started/");
	},

	renderContents() {
		return (
			<div className="contents">
				<RetinaImage src="boot2docker.png" checkIfRetinaImgExists={false}/>
				<div className="detail">
					<Radial progress={Math.round(this.state.progress)} thick={true} gray={true}/>
				</div>
			</div>
		);
	},

	renderProgress() {
		let title = "Starting Docker VM";
		let descr = "To run Docker containers on your computer, Kitematic is starting a Linux virtual machine. This may take a minute...";
		if (util.isNative()) {
			title = "Checking Docker";
			descr = "To run Docker containers on your computer, Kitematic is checking the Docker connection.";
		}
		return (
			<div className="setup">
				<Header hideLogin={true}/>
				<div className="setup-content">
					<div className="image">
						{this.renderContents()}
					</div>
					<div className="desc">
						<div className="content">
							<h1>{title}</h1>
							<p>{descr}</p>
						</div>
					</div>
				</div>
			</div>
		);
	},

	renderError() {
		let deleteVmAndRetry;

		if (util.isLinux()) {
			if (!this.state.started) {
				deleteVmAndRetry = (
					<button className="btn btn-action" onClick={this.handleLinuxDockerInstall}>Install Docker</button>
				);
			}
		} else if (util.isNative()) {
			deleteVmAndRetry = (
				<button className="btn btn-action" onClick={this.handleUseVbox}>Use VirtualBox</button>
			);
		} else if (this.state.started) {
			deleteVmAndRetry = (
				<button className="btn btn-action" onClick={this.handleErrorRemoveRetry}>Delete VM &amp; Retry Setup</button>
			);
		} else {
			deleteVmAndRetry = (
				<button className="btn btn-action" onClick={this.handleToolBox}>Get Toolbox</button>
			);
		}
		let usualError = (
			<div className="content">
				<h4>Setup Error</h4>
				<h1>We&#39;re Sorry!</h1>
				<p>There seems to have been an unexpected error with Kitematic:</p>
				<p className="error">{this.state.error.message || this.state.error}</p>
				<p className="setup-actions">
					<button className="btn btn-action" onClick={this.handleErrorRetry}>Retry Setup</button>
					{{deleteVmAndRetry}}
				</p>
			</div>
		);
		if (util.isNative()) {
			if (util.isLinux()) {
				usualError = (
					<div className="content">
						<h1>Setup Initialization</h1>
						<p>We couldn&apos;t find a native setup - Click the Retry button to check again.</p>
						<p className="setup-actions">
							<button className="btn btn-action" onClick={this.handleErrorRetry}>Retry Setup</button>
						</p>
					</div>
				);
			} else {
				usualError = (
					<div className="content">
						<h1>Setup Initialization</h1>
						<p>We couldn&apos;t find a native setup - Click the VirtualBox button to use VirtualBox instead or Retry to check again.</p>
						<p className="setup-actions">
							<button className="btn btn-action" onClick={this.handleErrorRetry}>Retry Setup</button>
							{{deleteVmAndRetry}}
						</p>
					</div>
				);
			}
		}
		return (
			<div className="setup">
				<Header hideLogin={true}/>
				<div className="setup-content">
					<div className="image">
						<div className="contents">
							<RetinaImage src="install-error.png" checkIfRetinaImgExists={false}/>
							<div className="detail">
								<a className="btn btn-danger small" onClick={this.handleResetSettings}>reset</a>
							</div>
						</div>
					</div>
					<div className="desc">
						{usualError}
					</div>
				</div>
			</div>
		);
	},

	render() {
		if (this.state.error) {
			return this.renderError();
		} else {
			return this.renderProgress();
		}
	},
});
