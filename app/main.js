var React = require('react');
var Router = require('react-router');
var RetinaImage = require('react-retina-image');
var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

var Raven = require('raven');
var async = require('async');
var docker = require('./docker.js');
var boot2docker = require('./boot2docker.js');
var Setup = require('./Setup.react');
var Containers = require('./Containers.react');
var ContainerDetails = require('./ContainerDetails.react');
var ContainerStore = require('./ContainerStore.js');
var Radial = require('./Radial.react');

var NoContainers = React.createClass({
  render: function () {
    return (
      <div>
        <Radial spin="true" progress="92"/>
      </div>
    );
  }
});

var App = React.createClass({
  componentWillMount: function () {
    ContainerStore.init();
  },
  render: function () {
    return (
      <RouteHandler/>
    );
  }
});

var routes = (
  <Route name="app" path="/" handler={App}>
    <Route name="containers" handler={Containers}>
      <Route name="container" path=":Id" handler={ContainerDetails}>
      </Route>
      <DefaultRoute handler={NoContainers}/>
    </Route>
    <DefaultRoute handler={Setup}/>
    <Route name="setup" handler={Setup}>
    </Route>
  </Route>
);

Router.run(routes, function (Handler) {
  boot2docker.ip(function (err, ip) {
    docker.setHost(ip);
    React.render(<Handler/>, document.body);
  });
});

if (process.env.NODE_ENV !== 'development') {
  Raven.config('https://0a5f032d745d4acaae94ce46f762c586@app.getsentry.com/35057', {
  }).install();
}
