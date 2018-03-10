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

const Route = Router.Route;
const DefaultRoute = Router.DefaultRoute;
const RouteHandler = Router.RouteHandler;

const App = React.createClass({
  render() {
    return (
      <RouteHandler/>
    );
  },
});

export default (
  <Route name="app" path="/" handler={App}>
    <Route name="account" path="account" handler={Account}>
      <Route name="signup" path="signup" handler={AccountSignup}/>
      <Route name="login" path="login" handler={AccountLogin}/>
    </Route>
    <Route name="containers" path="containers" handler={Containers}>
      <Route name="container" path="details/:name" handler={ContainerDetails}>
        <DefaultRoute name="containerHome" handler={ContainerHome} />
        <Route name="containerSettings" path="settings" handler={ContainerSettings}>
          <Route name="containerSettingsGeneral" path="general" handler={ContainerSettingsGeneral}/>
          <Route name="containerSettingsPorts" path="ports" handler={ContainerSettingsPorts}/>
          <Route name="containerSettingsVolumes" path="volumes" handler={ContainerSettingsVolumes}/>
          <Route name="containerSettingsNetwork" path="network" handler={ContainerSettingsNetwork}/>
          <Route name="containerSettingsAdvanced" path="advanced" handler={ContainerSettingsAdvanced}/>
        </Route>
      </Route>
      <Route name="search" handler={NewContainerSearch}/>
      <Route name="preferences" path="preferences" handler={Preferences}/>
      <Route name="about" path="about" handler={About}/>
    </Route>
    <DefaultRoute name="loading" handler={Loading}/>
    <Route name="setup" handler={Setup}/>
  </Route>
);
