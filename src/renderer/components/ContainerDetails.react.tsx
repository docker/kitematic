import Router from "react-router";
import React from "react/addons";
import _ from "underscore";
import ContainerDetailsSubheader from "./ContainerDetailsSubheader.react.jsx";
import containerUtil from "../../utils/ContainerUtil";
import util from "../../utils/Util";
import ContainerDetailsHeader from "./ContainerDetailsHeader.react.jsx";

export default React.createClass({
  contextTypes: {
	router: React.PropTypes.func,
  },

  render() {
	if (!this.props.container) {
		return false;
	}

	let ports = containerUtil.ports(this.props.container);
	let defaultPort = _.find(_.keys(ports), (port) => {
		return util.webPorts.indexOf(port) !== -1;
	});

	return (
		<div className="details">
		<ContainerDetailsHeader {...this.props} defaultPort={defaultPort} ports={ports}/>
		<ContainerDetailsSubheader {...this.props} defaultPort={defaultPort} ports={ports}/>
		<Router.RouteHandler {...this.props} defaultPort={defaultPort} ports={ports}/>
		</div>
	);
  },
});
