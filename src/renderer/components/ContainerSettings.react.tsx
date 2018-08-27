import * as $ from "jquery";
import Router from "react-router";
import React from "react/addons";
import _ from "underscore";

export default React.createClass({
	contextTypes: {
		router: React.PropTypes.func,
	},
	componentWillReceiveProps() {
		this.init();
	},
	componentDidMount() {
		this.init();
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
		$(".settings-panel").height(window.innerHeight - 210);
	},
	init() {
		const currentRoute = _.last(this.context.router.getCurrentRoutes()).name;
		if (currentRoute === "containerSettings") {
			this.context.router.transitionTo("containerSettingsGeneral", {name: this.context.router.getCurrentParams().name});
		}
	},
	render() {
		const container = this.props.container;
		if (!container) {
			return (<div></div>);
		}
		return (
			<div className="details-panel">
				<div className="settings">
					<div className="settings-menu">
						<ul>
							<Router.Link to="containerSettingsGeneral" params={{name: container.Name}}>
								<li>
									General
								</li>
							</Router.Link>
							<Router.Link to="containerSettingsPorts" params={{name: container.Name}}>
								<li>
									Hostname / Ports
								</li>
							</Router.Link>
							<Router.Link to="containerSettingsVolumes" params={{name: container.Name}}>
								<li>
									Volumes
								</li>
							</Router.Link>
							<Router.Link to="containerSettingsNetwork" params={{name: container.Name}}>
								<li>
									Network
								</li>
							</Router.Link>
							<Router.Link to="containerSettingsAdvanced" params={{name: container.Name}}>
								<li>
									Advanced
								</li>
							</Router.Link>
						</ul>
					</div>
					<Router.RouteHandler {...this.props}/>
				</div>
			</div>
		);
	},
});
