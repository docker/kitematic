import {Component} from "react";
import Router from "react-router";
import React from "react/addons";
import About from "./components/About.react";
import Account from "./components/Account.react";
import AccountLogin from "./components/AccountLogin.react";
import AccountSignup from "./components/AccountSignup.react";
import ContainerDetails from "./components/ContainerDetails.react";
import ContainerHome from "./components/ContainerHome.react";
import Containers from "./components/Containers.react";
import ContainerSettings from "./components/ContainerSettings.react";
import ContainerSettingsAdvanced from "./components/ContainerSettingsAdvanced.react";
import ContainerSettingsGeneral from "./components/ContainerSettingsGeneral.react";
import ContainerSettingsNetwork from "./components/ContainerSettingsNetwork.react";
import ContainerSettingsPorts from "./components/ContainerSettingsPorts.react";
import ContainerSettingsVolumes from "./components/ContainerSettingsVolumes.react";
import Loading from "./components/Loading.react";
import NewContainerSearch from "./components/NewContainerSearch.react";
import Preferences from "./components/Preferences.react";
import Setup from "./components/Setup.react";

export class App extends Component {

	public constructor(props) {
		super(props);
	}

	public render() {
		return (
			<Router.RouteHandler/>
		);
	}

}

export default (
	<Router.Route name="app" path="/" handler={App}>
		<Router.Route name="account" path="account" handler={Account}>
			<Router.Route name="signup" path="signup" handler={AccountSignup}/>
			<Router.Route name="login" path="login" handler={AccountLogin}/>
		</Router.Route>
		<Router.Route name="containers" path="containers" handler={Containers}>
			<Router.Route name="container" path="details/:name" handler={ContainerDetails}>
				<Router.DefaultRoute name="containerHome" handler={ContainerHome}/>
				<Router.Route name="containerSettings" path="settings" handler={ContainerSettings}>
					<Router.Route name="containerSettingsGeneral" path="general" handler={ContainerSettingsGeneral}/>
					<Router.Route name="containerSettingsPorts" path="ports" handler={ContainerSettingsPorts}/>
					<Router.Route name="containerSettingsVolumes" path="volumes" handler={ContainerSettingsVolumes}/>
					<Router.Route name="containerSettingsNetwork" path="network" handler={ContainerSettingsNetwork}/>
					<Router.Route name="containerSettingsAdvanced" path="advanced" handler={ContainerSettingsAdvanced}/>
				</Router.Route>
			</Router.Route>
			<Router.Route name="search" handler={NewContainerSearch}/>
			<Router.Route name="preferences" path="preferences" handler={Preferences}/>
			<Router.Route name="about" path="about" handler={About}/>
		</Router.Route>
		<Router.DefaultRoute name="loading" handler={Loading}/>
		<Router.Route name="setup" handler={Setup}/>
	</Router.Route>
);
