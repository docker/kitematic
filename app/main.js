var module = require('module');
require.main.paths.splice(0, 0, process.env.NODE_PATH);

var Bugsnag = require('bugsnag-js');
var React = require('react');
var Router = require('react-router');
var RetinaImage = require('react-retina-image');
var async = require('async');
var docker = require('./docker');
var router = require('./router');
var boot2docker = require('./boot2docker');
var ContainerStore = require('./ContainerStore');
var app = require('remote').require('app');

var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

Bugsnag.apiKey = 'fc51aab02ce9dd1bb6ebc9fe2f4d43d7';
Bugsnag.autoNotify = true;
Bugsnag.releaseStage = process.env.NODE_ENV === 'development' ? 'development' : 'production';
Bugsnag.notifyReleaseStages = [];
Bugsnag.appVersion = app.getVersion();

if (!window.location.hash.length || window.location.hash === '#/') {
  router.run(function (Handler) {
    React.render(<Handler/>, document.body);
  });
} else {
  boot2docker.ip(function (err, ip) {
    docker.setHost(ip);
    ContainerStore.init(function () {
      router.run(function (Handler) {
        React.render(<Handler/>, document.body);
      });
    });
  });
}
