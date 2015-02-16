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
var NewContainer = require('./NewContainer.react');
var Router = require('react-router');

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
    <Route name="containers" handler={Containers}>
      <Route name="containerDetails" path="/containers/:name" handler={ContainerDetails}>
        <Route name="containerHome" path="/containers/:name/home" handler={ContainerHome} />
        <Route name="containerLogs" path="/containers/:name/logs" handler={ContainerLogs}/>
        <Route name="containerSettings" path="/containers/:name/settings" handler={ContainerSettings}>
          <Route name="containerSettingsGeneral" path="/containers/:name/settings/general" handler={ContainerSettingsGeneral}/>
          <Route name="containerSettingsPorts" path="/containers/:name/settings/ports" handler={ContainerSettingsPorts}/>
          <Route name="containerSettingsVolumes" path="/containers/:name/settings/volumes" handler={ContainerSettingsVolumes}/>
        </Route>
      </Route>
      <Route name="preferences" path="/preferences" handler={Preferences}/>
      <DefaultRoute name="new" handler={NewContainer}/>
    </Route>
    <DefaultRoute name="setup" handler={Setup}/>
  </Route>
);

module.exports = routes;
