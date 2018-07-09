import {shell} from "electron";
import React from "react/addons";
import metrics from "../utils/MetricsUtil";

export default React.createClass({
  handleClickPreview() {
	metrics.track("Opened In Browser", {
		from: "preview",
	});
	shell.openExternal("http://" + this.props.ports[this.props.defaultPort].url);
  },

  handleClickPortSettings() {
	this.props.handleClickPortSettings();
  },

 render() {
	 const frame = React.createElement("webview", {
		 className: "frame",
		 id: "webview",
		 src: "http://" + this.props.ports[this.props.defaultPort].url,
		 autosize: "on",
	 });
	 return (
		<div className="web-preview wrapper">
		<div className="widget">
			<div className="top-bar">
			<div className="text">Web Preview</div>
			<div className="action" onClick={this.handleClickPreview}>
				<span className="icon icon-open-external"></span>
			</div>
			<div className="action" onClick={this.handleClickPortSettings}>
				<span className="icon icon-preferences"></span>
			</div>
			</div>
			{frame}
			<div onClick={this.handleClickPreview} className="frame-overlay"></div>
		</div>
		</div>
	);
  },
});
