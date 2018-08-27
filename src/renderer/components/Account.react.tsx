import Router from "react-router";
import React from "react/addons";
import accountActions from "../actions/AccountActions";
import {ImageResources} from "../resources/ImageResources";
import accountStore from "../stores/AccountStore";
import metrics from "../utils/MetricsUtil";
import Header from "./Header.react";

export default React.createClass({
  mixins: [Router.Navigation],

  getInitialState() {
	return accountStore.getState();
  },

  componentDidMount() {
	document.addEventListener("keyup", this.handleDocumentKeyUp, false);
	accountStore.listen(this.update);
  },

  componentWillUnmount() {
	document.removeEventListener("keyup", this.handleDocumentKeyUp, false);
	accountStore.unlisten(this.update);
  },

  componentWillUpdate(nextProps, nextState) {
	if (!this.state.username && nextState.username) {
		if (nextState.prompted) {
		this.goBack();
		} else {
		this.transitionTo("search");
		}
	}
  },

  handleSkip() {
	accountActions.skip();
	this.transitionTo("search");
	metrics.track("Skipped Login");
  },

  handleClose() {
	this.goBack();
	metrics.track("Closed Login");
  },

  update() {
	this.setState(accountStore.getState());
  },

  render() {
	let close = this.state.prompted ?
		<button className="btn btn-action btn-close" disabled={this.state.loading} onClick={this.handleClose}>Close</button> :
		<button className="btn btn-action btn-skip"  disabled={this.state.loading} onClick={this.handleSkip}>Skip For Now</button>;

	return (
		<div className="setup">
		<Header hideLogin={true}/>
		<div className="setup-content">
			{close}
			<div className="form-section">
			<img src={ImageResources.CONNECT_TO_HUB}/>
			<Router.RouteHandler errors={this.state.errors} loading={this.state.loading} {...this.props}/>
			</div>
			<div className="desc">
			<div className="content">
				<h1>Connect to Docker Hub</h1>
				<p>Pull and run private Docker Hub images by connecting your Docker Hub account to Kitematic.</p>
			</div>
			</div>
		</div>
		</div>
	);
  },
});
