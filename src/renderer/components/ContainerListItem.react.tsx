import {remote} from "electron";
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import Router from "react-router";
import React from "react/addons";
import containerActions from "../../actions/ContainerActions";
import metrics from "../../utils/MetricsUtil";
const dialog = remote.dialog;

export default React.createClass({
	toggleFavoriteContainer(e) {
		e.preventDefault();
		e.stopPropagation();
		containerActions.toggleFavorite(this.props.container.Name);
	},
	handleDeleteContainer(e) {
		e.preventDefault();
		e.stopPropagation();
		dialog.showMessageBox({
			message: "Are you sure you want to stop & remove this container?",
			buttons: ["Remove", "Cancel"],
		}, function(index) {
			if (index === 0) {
				metrics.track("Deleted Container", {
					from: "list",
					type: "existing",
				});
				containerActions.destroy(this.props.container.Name);
			}
		}.bind(this));
	},
	render() {
		const self = this;
		const container = this.props.container;
		const imageNameTokens = container.Config.Image.split("/");
		let repo;
		if (imageNameTokens.length > 1) {
			repo = imageNameTokens[1];
		} else {
			repo = imageNameTokens[0];
		}
		let imageName = (
			<OverlayTrigger placement="bottom" overlay={<Tooltip>{container.Config.Image}</Tooltip>}>
				<span>{repo}</span>
			</OverlayTrigger>
		);

		// Synchronize all animations
		let style = {
			WebkitAnimationDelay: 0 + "ms",
		};

		let state;
		if (container.State.Downloading) {
			state = (
				<OverlayTrigger placement="bottom" overlay={<Tooltip>Downloading</Tooltip>}>
					<div className="state state-downloading">
						<div style={style} className="downloading-arrow"></div>
					</div>
				</OverlayTrigger>
			);
		} else if (container.State.Running && !container.State.Paused) {
			state = (
				<OverlayTrigger placement="bottom" overlay={<Tooltip>Running</Tooltip>}>
					<div className="state state-running"><div style={style} className="runningwave"></div></div>
				</OverlayTrigger>
			);
		} else if (container.State.Restarting) {
			state = (
				<OverlayTrigger placement="bottom" overlay={<Tooltip>Restarting</Tooltip>}>
					<div className="state state-restarting" style={style}></div>
				</OverlayTrigger>
			);
		} else if (container.State.Paused) {
			state = (
				<OverlayTrigger placement="bottom" overlay={<Tooltip>Paused</Tooltip>}>
					<div className="state state-paused"></div>
				</OverlayTrigger>
			);
		} else if (container.State.ExitCode) {
			state = (
				<OverlayTrigger placement="bottom" overlay={<Tooltip>Stopped</Tooltip>}>
					<div className="state state-stopped"></div>
				</OverlayTrigger>
			);
		} else {
			state = (
				<OverlayTrigger placement="bottom" overlay={<Tooltip>Stopped</Tooltip>}>
					<div className="state state-stopped"></div>
				</OverlayTrigger>
			);
		}

		return (
			<Router.Link to="container" params={{name: container.Name}}>
				<li onMouseEnter={self.handleItemMouseEnter} onMouseLeave={self.handleItemMouseLeave} onClick={self.handleClick} id={this.props.key}>
					{state}
					<div className="info">
						<div className="name">
							{container.Name}
						</div>
						<div className="image">
							{imageName}
						</div>
					</div>
					<div className="action">
						<span className={container.Favorite ? "btn circular favorite" : "btn circular"} onClick={this.toggleFavoriteContainer}><span className="icon icon-favorite"></span></span>
						<span className="btn circular" onClick={this.handleDeleteContainer}><span className="icon icon-delete"></span></span>
					</div>
				</li>
			</Router.Link>
		);
	},
});
