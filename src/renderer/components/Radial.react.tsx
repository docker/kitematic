import classNames from "classnames";
import {Component} from "react";
import React from "react/addons";

export default class Radial extends Component<RadialProps, RadialState> {

	public constructor(props) {
		super(props);
	}

	public render() {
		let percentage;
		if ((this.props.progress !== null && this.props.progress !== undefined) && !this.props.spin && !this.props.error) {
			percentage = (
				<div className="percentage"></div>
			);
		} else {
			percentage = <div></div>;
		}
		let classes = classNames({
			"radial-progress": true,
			"radial-spinner": this.props.spin,
			"radial-negative": this.props.error,
			"radial-thick": this.props.thick || false,
			"radial-gray": this.props.gray || false,
			"radial-transparent": this.props.transparent || false,
		});
		return (
			<div className={classes} data-progress={this.props.progress}>
				<div className="circle">
					<div className="mask full">
						<div className="fill"></div>
					</div>
					<div className="mask half">
						<div className="fill"></div>
						<div className="fill fix"></div>
					</div>
					<div className="shadow"></div>
				</div>
				<div className="inset">
					{percentage}
				</div>
			</div>
		);
	}

}

export class RadialProps {
	public error?: boolean;
	public gray?: boolean;
	public progress?: number;
	public spin?: boolean;
	public thick?: boolean;
	public transparent?: boolean;
}

export class RadialState {

}
