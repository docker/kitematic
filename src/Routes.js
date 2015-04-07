var React = require('react/addons');
var Setup = require('./Setup.react');
var Containers = require('./Containers.react');
var ContainerDetails = require('./ContainerDetails.react');
var ContainerHome = require('./ContainerHome.react');
var ContainerLogs = require('./ContainerLogs.react');
var ContainerSettings = require('./ContainerSettings.react');
var ContainerSettingsGeneral = require('./ContainerSettingsGeneral.react');
var ContainerSettingsPorts = require('./ContainerSettingsPorts.react');
var ContainerSettingsVolumes = require('./ContainerSettingsVolumes.react');
var Preferences = require('./Preferences.react');
var NewContainerSearch = require('./NewContainerSearch.react');
var NewContainerPull = require('./NewContainerPull.react');
var Router = require('react-router');

var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;
var Redirect = Router.Redirect;

var App = React.createClass({
  render: function () {
    return (
      <RouteHandler/>
    );
  }
});

var routes = (
  <Route name="app" path="/" handler={App}>
    <Route name="containers" handler={Containers}>
      <Route name="containerDetails" path="containers/details/:name" handler={ContainerDetails}>
        <Route name="containerHome" path="containers/details/:name/home" handler={ContainerHome} />
        <Route name="containerLogs" path="containers/details/:name/logs" handler={ContainerLogs}/>
        <Route name="containerSettings" path="containers/details/:name/settings" handler={ContainerSettings}>
          <Route name="containerSettingsGeneral" path="containers/details/:name/settings/general" handler={ContainerSettingsGeneral}/>
          <Route name="containerSettingsPorts" path="containers/details/:name/settings/ports" handler={ContainerSettingsPorts}/>
          <Route name="containerSettingsVolumes" path="containers/details/:name/settings/volumes" handler={ContainerSettingsVolumes}/>
        </Route>
      </Route>
      <Route name="new" path="containers/new">
        <DefaultRoute name="search" handler={NewContainerSearch}/>
        <Route name="pull" path="containers/new/pull" handler={NewContainerPull}></Route>
      </Route>
      <Route name="preferences" path="/preferences" handler={Preferences}/>
      <Redirect to="new"/>
    </Route>
    <DefaultRoute name="setup" handler={Setup}/>
  </Route>
);

module.exports = routes;
