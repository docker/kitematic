var React = require('react/addons');
var Setup = require('./components/Setup.react');
var Containers = require('./components/Containers.react');
var ContainerDetails = require('./components/ContainerDetails.react');
var ContainerHome = require('./components/ContainerHome.react');
var ContainerLogs = require('./components/ContainerLogs.react');
var ContainerSettings = require('./components/ContainerSettings.react');
var ContainerSettingsGeneral = require('./components/ContainerSettingsGeneral.react');
var ContainerSettingsPorts = require('./components/ContainerSettingsPorts.react');
var ContainerSettingsVolumes = require('./components/ContainerSettingsVolumes.react');
var Preferences = require('./components/Preferences.react');
var NewContainer = require('./components/NewContainer.react');
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
      <Route name="containerDetails" path="containers/:name" handler={ContainerDetails}>
        <Route name="containerHome" path="containers/:name/home" handler={ContainerHome} />
        <Route name="containerLogs" path="containers/:name/logs" handler={ContainerLogs}/>
        <Route name="containerSettings" path="containers/:name/settings" handler={ContainerSettings}>
          <Route name="containerSettingsGeneral" path="containers/:name/settings/general" handler={ContainerSettingsGeneral}/>
          <Route name="containerSettingsPorts" path="containers/:name/settings/ports" handler={ContainerSettingsPorts}/>
          <Route name="containerSettingsVolumes" path="containers/:name/settings/volumes" handler={ContainerSettingsVolumes}/>
        </Route>
      </Route>
      <Route name="preferences" path="/preferences" handler={Preferences}/>
      <DefaultRoute name="new" handler={NewContainer}/>
    </Route>
    <DefaultRoute name="setup" handler={Setup}/>
  </Route>
);

module.exports = routes;
