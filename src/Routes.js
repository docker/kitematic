var React = require('react/addons');
var Setup = require('./Setup.react');
var Containers = require('./Containers.react');
var ContainerDetails = require('./ContainerDetails.react');
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
      <Route name="container" path="/containers/:name" handler={ContainerDetails}/>
      <Route name="preferences" path="/preferences" handler={Preferences}/>
      <DefaultRoute name="new" handler={NewContainer}/>
    </Route>
    <DefaultRoute name="setup" handler={Setup}/>
  </Route>
);

module.exports = routes;
