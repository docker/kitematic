var React = require('react');
var Router = require('react-router');
var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

var Container = React.createClass({
  render: function () {
    return <p>Hello</p>;
  }
});

module.exports = Container;
