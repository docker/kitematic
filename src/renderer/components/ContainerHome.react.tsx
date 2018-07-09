import {shell} from "electron";
import * as $ from "jquery";
import React from "react/addons";
import _ from "underscore";
import ContainerHomeFolders from "./ContainerHomeFolders.react.jsx";
import ContainerHomeLogs from "./ContainerHomeLogs.react.jsx";
import ContainerHomePreview from "./ContainerHomePreview.react.jsx";
import ContainerProgress from "./ContainerProgress.react.jsx";

export default React.createClass({
	contextTypes: {
		router: React.PropTypes.func,
	},

	componentDidMount() {
		this.handleResize();
		window.addEventListener("resize", this.handleResize);
	},

	componentWillUnmount() {
		window.removeEventListener("resize", this.handleResize);
	},

	componentDidUpdate() {
		this.handleResize();
	},

	handleResize() {
		$(".full .wrapper").height(window.innerHeight - 132);
		$(".left .wrapper").height(window.innerHeight - 132);
		$(".right .wrapper").height(window.innerHeight / 2 - 55);
	},

	handleErrorClick() {
		// Display wiki for proxy: https://github.com/docker/kitematic/wiki/Common-Proxy-Issues-&-Fixes
		shell.openExternal("https://github.com/kitematic/kitematic/issues/new");
	},

	showWeb() {
		return _.keys(this.props.ports).length > 0;
	},

	showFolders() {
		return this.props.container.Mounts && this.props.container.Mounts.length > 0 && this.props.container.State.Running;
	},

	render() {
		if (!this.props.container) {
			return "";
		}

		let body;
		if (this.props.container.Error) {
			let error = this.props.container.Error.message;
			if (!error) {
				error = this.props.container.Error;
			} else {
				if (error.indexOf("ETIMEDOUT") !== -1) {
					error = 'Timeout error - Try and restart your VM by running: \n"docker-machine restart default" in a terminal';
				}
				if (error.indexOf("ECONNREFUSED") !== -1) {
					error = 'Is your VM up and running? Check that "docker ps" works in a terminal.';
				}
			}
			body = (
				<div className="details-progress error">
					<h2>We&#39;re sorry. There seems to be an error:</h2>
					{error.split("\n").map((i) => {
						return <p className="error-message">{i}</p>;
					})}
					<p>If this error is invalid, please file a ticket on our Github repo.</p>
					<a className="btn btn-action" onClick={this.handleErrorClick}>File Ticket</a>
				</div>
			);
		} else if (this.props.container && this.props.container.State.Downloading) {
			if (this.props.container.Progress) {
				let values = [];
				let sum = 0.0;

				for (let i = 0; i < this.props.container.Progress.amount; i++) {
					values.push(Math.round(this.props.container.Progress.progress[i].value));
					sum += this.props.container.Progress.progress[i].value;
				}

				sum = sum / this.props.container.Progress.amount;
				if (isNaN(sum)) {
					sum = 0;
				}

				let total = parseFloat ((Math.round(sum * 100) / 100).toFixed(2));

				body = (
					<div className="details-progress">
						<h2>{total >= 100 ? "Creating Container" : "Downloading Image"}</h2>
						<h2>{total}%</h2>
						<div className="container-progress-wrapper">
							<ContainerProgress pBar1={values[0]} pBar2={values[1]} pBar3={values[2]} pBar4={values[3]}/>
						</div>
					</div>
				);

			} else if (this.props.container.State.Waiting) {
				body = (
					<div className="details-progress">
						<h2>Waiting For Another Download</h2>
						<div className="spinner la-ball-clip-rotate la-lg la-dark"><div></div></div>
					</div>
				);
			} else {
				body = (
					<div className="details-progress">
						<h2>Connecting to Docker Hub</h2>
						<div className="spinner la-ball-clip-rotate la-lg la-dark"><div></div></div>
					</div>
				);
			}
		} else {
			let logWidget = (
				<ContainerHomeLogs container={this.props.container}/>
			);
			let webWidget;
			if (this.showWeb()) {
				webWidget = (
					<ContainerHomePreview ports={this.props.ports} defaultPort={this.props.defaultPort} />
				);
			}
			let folderWidget;
			if (this.showFolders()) {
				folderWidget = (
					<ContainerHomeFolders container={this.props.container} />
				);
			}
			if (logWidget && !webWidget && !folderWidget) {
				body = (
					<div className="details-panel home">
						<div className="content">
							<div className="full">
								{logWidget}
							</div>
						</div>
					</div>
				);
			} else {
				body = (
					<div className="details-panel home">
						<div className="content">
							<div className="left">
								{logWidget}
							</div>
							<div className="right">
								{webWidget}
								{folderWidget}
							</div>
						</div>
					</div>
				);
			}
		}
		return body;
	},
});
