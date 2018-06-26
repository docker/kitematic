import classNames from "classnames";
import {remote} from "electron";
import {Component} from "react";
import Router from "react-router";
import React from "react/addons";
import accountActions from "../../actions/AccountActions";
import metrics from "../../utils/MetricsUtil";
import util from "../../utils/Util";
import {ImageResources} from "../resources/ImageResources";
import accountStore from "../stores/AccountStore";

export default class Header extends Component<HeaderProps, HeaderState> {

	public mixins = [Router.Navigation];

	public constructor(props) {
		super(props);
		this.state = new HeaderState();
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
		this.setState({
			username: accountState.username,
			verified: accountState.verified,
		});
	}

	public handleDocumentKeyUp(e) {
		if (e.keyCode === 27 && remote.getCurrentWindow().isFullScreen()) {
			remote.getCurrentWindow().setFullScreen(false);
			this.forceUpdate();
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
			this.setState({
				fullscreen: remote.getCurrentWindow().isMaximized(),
			});
		} else {
			remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().isFullScreen());
			this.setState({
				fullscreen: remote.getCurrentWindow().isFullScreen(),
			});
		}
	}

	public handleFullscreenHover() {
		this.update();
	}

	public handleUserClick(e) {
		const menu = new remote.Menu();
		if (!this.state.verified) {
			menu.append(new remote.MenuItem({label: "I've Verified My Email Address", click: this.handleVerifyClick}));
		}

		menu.append(new remote.MenuItem({
			label: "Sign Out",
			click: this.handleLogoutClick,
		}));
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
				<img src={ImageResources.LOGO} width={40} height={32}/>
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
			"bordered": !this.props.hideLogin,
			"header": true,
			"no-drag": true,
		});
		let username;
		if (this.props.hideLogin) {
			username = null;
		} else if (this.state.username) {
			username = (
				<div className="login-wrapper">
					<div className="login no-drag" onClick={this.handleUserClick}>
						<span className="icon icon-user"></span>
						<span className="text">
				{(this as any).state.username}
							{(this as any).state.verified ? null : "(Unverified)"}
				</span>
						<img src={ImageResources.USER_DROP_DOWN}/>
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
			"bordered": !this.props.hideLogin,
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
		if (this.props.hideLogin) {
			return this.renderBasicHeader();
		} else {
			return this.renderDashboardHeader();
		}
	}

}

export class HeaderProps {

	public hideLogin: boolean;

}

export class HeaderState {

	public fullscreen = false;

	public updateAvailable = false;

	public username = accountStore.getState().username;

	public verified = accountStore.getState().verified;

}
