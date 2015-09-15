import React from 'react/addons';
import Setup from './components/Setup.react';
import Account from './components/Account.react';
import AccountSignup from './components/AccountSignup.react';
import AccountLogin from './components/AccountLogin.react';
import Containers from './components/Containers.react';
import ContainerDetails from './components/ContainerDetails.react';
import ContainerHome from './components/ContainerHome.react';
import ContainerLogs from './components/ContainerLogs.react';
import ContainerSettings from './components/ContainerSettings.react';
import ContainerSettingsGeneral from './components/ContainerSettingsGeneral.react';
import ContainerSettingsPorts from './components/ContainerSettingsPorts.react';
import ContainerSettingsVolumes from './components/ContainerSettingsVolumes.react';
import ContainerSettingsAdvanced from './components/ContainerSettingsAdvanced.react';
import Preferences from './components/Preferences.react';
import About from './components/About.react';
import NewContainerSearch from './components/NewContainerSearch.react';
import NewContainerPull from './components/NewContainerPull.react';
import Router from 'react-router';

var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;

var App = React.createClass({
  render: function () {
    return (
      <RouteHandler/>
    );
  }
});

var routes = (
  <Route name="app" path="/" handler={App}>
    <Route name="account" path="account" handler={Account}>
      <Route name="signup" path="signup" handler={AccountSignup}/>
      <Route name="login" path="login" handler={AccountLogin}/>
    </Route>
    <Route name="containers" path="containers" handler={Containers}>
      <Route name="container" path="details/:name" handler={ContainerDetails}>
        <DefaultRoute name="containerHome" handler={ContainerHome} />
        <Route name="containerLogs" path="logs" handler={ContainerLogs}/>
        <Route name="containerSettings" path="settings" handler={ContainerSettings}>
          <Route name="containerSettingsGeneral" path="general" handler={ContainerSettingsGeneral}/>
          <Route name="containerSettingsPorts" path="ports" handler={ContainerSettingsPorts}/>
          <Route name="containerSettingsVolumes" path="volumes" handler={ContainerSettingsVolumes}/>
          <Route name="containerSettingsAdvanced" path="advanced" handler={ContainerSettingsAdvanced}/>
        </Route>
      </Route>
      <Route name="new" path="new">
        <DefaultRoute name="search" handler={NewContainerSearch}/>
        <Route name="pull" path="pull" handler={NewContainerPull}></Route>
      </Route>
      <Route name="preferences" path="preferences" handler={Preferences}/>
      <Route name="about" path="about" handler={About}/>
    </Route>
    <DefaultRoute name="setup" handler={Setup}/>
  </Route>
);

module.exports = routes;
