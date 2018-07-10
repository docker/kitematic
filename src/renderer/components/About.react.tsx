import Router from "react-router";
import React from "react/addons";
import {ImageResources} from "../resources/ImageResources";
import metrics from "../utils/MetricsUtil";
import {Util} from "../utils/Util";

export default React.createClass({

	mixins: [Router.Navigation],

	getInitialState() {
		return {
			metricsEnabled: metrics.enabled(),
		};
	},

	handleGoBackClick() {
		this.goBack();
		metrics.track("Went Back From About");
	},

	render() {
		return (
			<div className="preferences">
				<div className="about-content">
					<a onClick={this.handleGoBackClick}>Go Back</a>
					<div className="items">
						<div className="item">
							<img src={ImageResources.CARTOON_KITEMATIC}/>
							<h4>Docker {Util.PackageJson.name}</h4>
							<p>{Util.PackageJson.version}</p>
						</div>
					</div>
					<h3>Kitematic is built with:</h3>
					<div className="items">
						<div className="item">
							<img src={ImageResources.CARTOON_DOCKER}/>
							<h4>Docker Engine</h4>
						</div>
						<div className="item">
							<img src={ImageResources.CARTOON_DOCKER_MACHINE}/>
							<h4>Docker Machine</h4>
							<p>{Util.PackageJson["docker-machine-version"]}</p>
						</div>
					</div>
					<h3>Third-Party Software</h3>
					<div className="items">
						<div className="item">
							<h4>VirtualBox</h4>
							<p>{Util.PackageJson["virtualbox-version"]}</p>
						</div>
					</div>
					<div className="items">
						<div className="item">
							<h4>Electron</h4>
							<p>{Util.PackageJson["electron-version"]}</p>
						</div>
					</div>
				</div>
			</div>
		);
	},

});
