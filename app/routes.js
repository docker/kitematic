var React = require('react');
var Setup = require('./Setup.react');
var Containers = require('./Containers.react');
var ContainerDetails = require('./ContainerDetails.react');
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

var NoContainers = React.createClass({
  render: function () {
    return (
      <div>
        No Containers
      </div>
    );
  }
});

var routes = (
  <Route name="app" path="/" handler={App}>
    <Route name="containers" handler={Containers}>
      <Route name="container" path=":name" handler={ContainerDetails}>
      </Route>
      <DefaultRoute handler={NoContainers}/>
    </Route>
    <DefaultRoute handler={Setup}/>
    <Route name="setup" handler={Setup}>
    </Route>
  </Route>
);

module.exports = routes;
