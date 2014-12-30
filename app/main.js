var React = require('react');
var Router = require('react-router');
var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

var boot2docker = require('./boot2docker.js');

var App = React.createClass({
  render: function () {
    return (
      <RouteHandler/>
    );
  }
});

var Setup = React.createClass({
  render: function () {
    return (
      <p>Hello!</p>
    );
  },
  componentWillMount: function () {

  },
  setup: function () {

  },
  steps: [

  ]
});

var Containers = React.createClass({
  render: function () {
    return (
      <div>
        <ContainerList/>
        <RouteHandler/>
      </div>
    );
  }
});

var ContainerList = React.createClass({
  render: function () {
    return (
      <ul>
        <li>Container 1</li>
        <li>Container 2</li>
        <li>Container 3</li>
        <li>Container 4</li>
        <li>Container 5</li>
      </ul>
    );
  }
});

var NoContainers = React.createClass({
  render: function () {
    return (
      <p>No containers</p>
    );
  }
});

var routes = (
  <Route name="app" path="/" handler={App}>
    <DefaultRoute handler={Setup}/>
    <Route name="containers" handler={Containers}>
      <DefaultRoute handler={NoContainers}/>
    </Route>
    <Route name="setup" handler={Setup}>
    </Route>
  </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.body);
});
