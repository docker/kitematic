import {Component} from "react";
import React from "react/addons";
import Header from "./Header.react.jsx";

export default class Loading extends Component<LoadingProps, LoadingState> {

	public constructor(props) {
		super(props);
	}

	public render() {
		return (
			<div className="loading">
				<Header hideLogin={true}/>
				<div className="loading-content">
					<div className="spinner la-ball-clip-rotate la-lg la-dark">
						<div></div>
					</div>
				</div>
			</div>
		);
	}

}

export class LoadingProps {

}

export class LoadingState {

}
