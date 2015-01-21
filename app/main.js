var React = require('react');
var Router = require('react-router');
var RetinaImage = require('react-retina-image');
var Raven = require('raven');
var async = require('async');
var docker = require('./docker.js');
var boot2docker = require('./boot2docker.js');
var Setup = require('./Setup.react');
var Containers = require('./Containers.react');
var ContainerDetails = require('./ContainerDetails.react');
var ContainerStore = require('./ContainerStore');
var Radial = require('./Radial.react');

var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
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

boot2docker.ip(function (err, ip) {
  if (window.location.hash !== '#/') {
    docker.setHost(ip);
    ContainerStore.init(function () {
      Router.run(routes, function (Handler) {
        React.render(<Handler/>, document.body);
      });
    });
  } else {
    Router.run(routes, function (Handler) {
      React.render(<Handler/>, document.body);
    });
  }
});

if (process.env.NODE_ENV !== 'development') {
  Raven.config('https://0a5f032d745d4acaae94ce46f762c586@app.getsentry.com/35057', {
  }).install();
}
