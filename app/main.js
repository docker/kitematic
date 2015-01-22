var React = require('react');
var Router = require('react-router');
var RetinaImage = require('react-retina-image');
var Raven = require('raven');
var async = require('async');
var docker = require('./docker');
var router = require('./router');
var boot2docker = require('./boot2docker');
var ContainerStore = require('./ContainerStore');

var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

boot2docker.ip(function (err, ip) {
  if (window.location.hash !== '#/') {
    docker.setHost(ip);
    ContainerStore.init(function () {
      router.run(function (Handler) {
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
