import classNames from "classnames";
import {remote} from "electron";
import {Component} from "react";
import RetinaImage from "react-retina-image";
import Router from "react-router";
import React from "react/addons";
import accountActions from "../actions/AccountActions";
import accountStore from "../stores/AccountStore";
import metrics from "../utils/MetricsUtil";
import util from "../utils/Util";

export default class Header extends Component<HeaderProps, HeaderState> {

	public mixins = [Router.Navigation];

	public constructor(props) {
		super(props);
		(this as any).state = new HeaderState();
	}

	public componentDidMount() {
		document.addEventListener("keyup", this.handleDocumentKeyUp, false);
		accountStore.listen(this.update);
	}

	public componentWillUnmount() {
		document.removeEventListener("keyup", this.handleDocumentKeyUp, false);
		accountStore.unlisten(this.update);
	}

	public update() {
		const accountState = accountStore.getState();
		(this as any).setState({
			username: accountState.username,
			verified: accountState.verified,
		});
	}

	public handleDocumentKeyUp(e) {
		if (e.keyCode === 27 && remote.getCurrentWindow().isFullScreen()) {
			remote.getCurrentWindow().setFullScreen(false);
			(this as any).forceUpdate();
		}
	}

	public handleClose() {
		if (util.isWindows() || util.isLinux()) {
			remote.getCurrentWindow().close();
		} else {
			remote.getCurrentWindow().hide();
		}
	}

	public handleMinimize() {
		remote.getCurrentWindow().minimize();
	}

	public handleFullscreen() {
		if (util.isWindows()) {
			if (remote.getCurrentWindow().isMaximized()) {
				remote.getCurrentWindow().unmaximize();
			} else {
				remote.getCurrentWindow().maximize();
			}
			(this as any).setState({
				fullscreen: remote.getCurrentWindow().isMaximized(),
			});
		} else {
			remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().isFullScreen());
			(this as any).setState({
				fullscreen: remote.getCurrentWindow().isFullScreen(),
			});
		}
	}

	public handleFullscreenHover() {
		this.update();
	}

	public handleUserClick(e) {
		const menu = new remote.Menu();
		if (!(this as any).state.verified) {
			menu.append(new remote.MenuItem({label: "I've Verified My Email Address", click: this.handleVerifyClick}));
		}

		menu.append(new remote.MenuItem({label: "Sign Out", click: this.handleLogoutClick}));
		menu.popup({
			window: remote.getCurrentWindow(),
			x: e.currentTarget.offsetLeft,
			y: e.currentTarget.offsetTop + e.currentTarget.clientHeight + 10,
		});
	}

	public handleLoginClick() {
		(this as any).transitionTo("login");
		metrics.track("Opened Log In Screen");
	}

	public handleLogoutClick() {
		metrics.track("Logged Out");
		accountActions.logout();
	}

	public handleVerifyClick() {
		metrics.track("Verified Account", {
			from: "header",
		});
		accountActions.verify();
	}

	public renderLogo() {
		return (
			<div className="logo">
				<RetinaImage src="logo.png"/>
			</div>
		);
	}

	public renderWindowButtons() {
		if (util.isWindows()) {
			return (
				<div className="windows-buttons">
					<div className="windows-button button-minimize enabled" onClick={this.handleMinimize}>
						<div className="icon"></div>
					</div>
					<div
						className={`windows-button ${(this as any).state.fullscreen ? "button-fullscreenclose" : "button-fullscreen"} enabled`}
						onClick={this.handleFullscreen}>
						<div className="icon"></div>
					</div>
					<div className="windows-button button-close enabled" onClick={this.handleClose}></div>
				</div>
			);
		} else {
			return  (
				<div className="buttons">
					<div className="button button-close enabled" onClick={this.handleClose}></div>
					<div className="button button-minimize enabled" onClick={this.handleMinimize}></div>
					<div className="button button-fullscreen enabled" onClick={this.handleFullscreen}></div>
				</div>
			);
		}
	}

	public renderDashboardHeader() {
		const headerClasses = classNames({
			"bordered": !(this as any).props.hideLogin,
			"header": true,
			"no-drag": true,
		});
		let username;
		if ((this as any).props.hideLogin) {
			username = null;
		} else if ((this as any).state.username) {
			username = (
				<div className="login-wrapper">
					<div className="login no-drag" onClick={this.handleUserClick}>
						<span className="icon icon-user"></span>
						<span className="text">
				{(this as any).state.username}
							{(this as any).state.verified ? null : "(Unverified)"}
				</span>
						<RetinaImage src="userdropdown.png"/>
					</div>
				</div>
			);
		} else {
			username = (
				<div className="login-wrapper">
					<div className="login no-drag" onClick={this.handleLoginClick}>
						<span className="icon icon-user"></span> LOGIN
					</div>
				</div>
			);
		}
		return (
			<div className={headerClasses}>
				<div className="left-header">
					{util.isWindows() ? this.renderLogo() : this.renderWindowButtons()}
					{username}
				</div>
				<div className="right-header">
					{util.isWindows() ? this.renderWindowButtons() : this.renderLogo()}
				</div>
			</div>
		);
	}

	public renderBasicHeader() {
		const headerClasses = classNames({
			"bordered": !(this as any).props.hideLogin,
			"header": true,
			"no-drag": true,
		});
		return (
			<div className={headerClasses}>
				<div className="left-header">
					{util.isWindows() ? null : this.renderWindowButtons()}
				</div>
				<div className="right-header">
					{util.isWindows() ? this.renderWindowButtons() : null}
				</div>
			</div>
		);
	}

	public render() {
		if ((this as any).props.hideLogin) {
			return this.renderBasicHeader();
		} else {
			return this.renderDashboardHeader();
		}
	}

}

export class HeaderProps {

}

export class HeaderState {

	public fullscreen = false;

	public updateAvailable = false;

	public username = accountStore.getState().username;

	public verified = accountStore.getState().verified;

}
