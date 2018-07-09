import React from "react/addons";
import ContainerListItem from "./ContainerListItem.react.jsx";

export default React.createClass({
	componentWillMount() {
		this.start = Date.now();
	},
	render() {
		const containers = this.props.containers.map((container) => {
			return (
				<ContainerListItem key={container.Id} container={container} start={this.start}/>
			);
		});
		return (
			<ul>
				{containers}
			</ul>
		);
	},
});
