import React from 'react/addons';

export default React.createClass({
	render: function () {
		const pBar1Style = {
			height: this.props.pBar1 + '%'
		};
		const pBar2Style = {
			height: this.props.pBar2 + '%'
		};
		const pBar3Style = {
			height: this.props.pBar3 + '%'
		};
		const pBar4Style = {
			height: this.props.pBar4 + '%'
		};
		return (
			<div className="container-progress">
				<div className="bar-1 bar-bg">
					<div className="bar-fg" style={pBar4Style}></div>
				</div>
				<div className="bar-2 bar-bg">
					<div className="bar-fg" style={pBar3Style}></div>
				</div>
				<div className="bar-3 bar-bg">
					<div className="bar-fg" style={pBar2Style}></div>
				</div>
				<div className="bar-4 bar-bg">
					<div className="bar-fg" style={pBar1Style}></div>
				</div>
			</div>
		);
	}
});
