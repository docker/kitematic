import React from "react/addons";
import _ from "underscore";

export default React.createClass({
  handleClickPortSettings() {
	this.props.handleClickPortSettings();
  },

  render() {
	let ports = _.map(_.pairs(this.props.ports), (pair) => {
		let key = pair[0];
		let val = pair[1];
		return (
			<tr key={key}>
			<td>{key + "/" + val.portType}</td>
			<td>{val.url}</td>
			</tr>
		);
	});

	return (
		<div className="web-preview wrapper">
		<div className="widget">
			<div className="top-bar">
			<div className="text">IP & PORTS</div>
			<div className="action" onClick={this.handleClickPortSettings}>
				<span className="icon icon-preferences"></span>
			</div>
			</div>
			<p>You can access this container using the following IP address and port:</p>
			<table className="table">
			<thead>
				<tr>
				<th>DOCKER PORT</th>
				<th>ACCESS URL</th>
				</tr>
			</thead>
			<tbody>
				{ports}
			</tbody>
			</table>
		</div>
		</div>
	);
  },
});
