import React from "react/addons";
import _ from "underscore";
import ContainerUtil from "../../utils/ContainerUtil";
import containerActions from "../actions/ContainerActions";
import metrics from "../utils/MetricsUtil";

export default React.createClass({
  mixins: [React.addons.LinkedStateMixin],

  contextTypes: {
	router: React.PropTypes.func,
  },

  getInitialState() {
	let [tty, openStdin, privileged, restartPolicy] = ContainerUtil.mode(this.props.container) || [true, true, false, {MaximumRetryCount: 0, Name: "no"}];
	return {
		tty,
		openStdin,
		privileged,
		restartPolicy: restartPolicy.Name === "always",
	};
  },

  handleSaveAdvancedOptions() {
	metrics.track("Saved Advanced Options");
	let tty = this.state.tty;
	let openStdin = this.state.openStdin;
	let privileged = this.state.privileged;
	let restartPolicy = this.state.restartPolicy ? {MaximumRetryCount: 0, Name: "always"} : {MaximumRetryCount: 0, Name: "no"};
	let hostConfig = _.extend(this.props.container.HostConfig, {Privileged: privileged, RestartPolicy: restartPolicy});
	containerActions.update(this.props.container.Name, {Tty: tty, OpenStdin: openStdin, HostConfig: hostConfig});
  },

  handleChangeTty() {
	this.setState({
		tty: !this.state.tty,
	});
  },

  handleChangeOpenStdin() {
	this.setState({
		openStdin: !this.state.openStdin,
	});
  },

  handleChangePrivileged() {
	this.setState({
		privileged: !this.state.privileged,
	});
  },

  handleChangeRestartPolicy() {
	this.setState({
		restartPolicy: !this.state.restartPolicy,
	});
  },

  render() {
	if (!this.props.container) {
		return false;
	}

	return (
		<div className="settings-panel">
		<div className="settings-section">
			<h3>Advanced Options</h3>
			<div className="checkboxes">
			<p><label><input type="checkbox" checked={this.state.tty} onChange={this.handleChangeTty}/>Allocate a TTY for this container</label></p>
			<p><label><input type="checkbox" checked={this.state.openStdin} onChange={this.handleChangeOpenStdin}/>Keep STDIN open even if not attached</label></p>
			<p><label><input type="checkbox" checked={this.state.privileged} onChange={this.handleChangePrivileged}/>Privileged mode</label></p>
			<p><label><input type="checkbox" checked={this.state.restartPolicy} onChange={this.handleChangeRestartPolicy}/>Enable 'always' restart policy</label></p>
			</div>
			<button className="btn btn-action" disabled={this.props.container.State.Updating} onClick={this.handleSaveAdvancedOptions}>Save</button>
		</div>
		</div>
	);
  },
});
