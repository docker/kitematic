var React = require('react');
var Router = require('react-router');
var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;
var Navigation= Router.Navigation;

var async = require('async');
var docker = require('./docker.js');

var ContainerList = React.createClass({
  render: function () {
    var containers = this.props.containers.map(function (container) {
      return <li key={container.Id}><Link to="container" params={container}>{container.Name.replace('/', '')}</Link></li>
    });
    return (
      <ul>
        {containers}
      </ul>
    );
  }
});

var Containers = React.createClass({
  mixins: [Navigation],
  getInitialState: function() {
    return {containers: []};
  },
  update: function () {
    var self = this;
    docker.client().listContainers({all: true}, function (err, containers) {
      async.map(containers, function(container, callback) {
        docker.client().getContainer(container.Id).inspect(function (err, data) {
          callback(null, data);
        });
      }, function (err, results) {
        if (results.length > 0) {
          self.transitionTo('container', {Id: results[0].Id})
        }
        self.setState({containers: results});
      });
    });
  },
  componentDidMount: function () {
    this.update();
    var self = this;
    docker.client().getEvents(function (err, stream) {
      if (err) {
        throw err;
      }
      stream.setEncoding('utf8');
      stream.on('data', function (data) {
        self.update();
      });
    });
  },
  render: function () {
    return (
      <div>
        <ContainerList containers={this.state.containers}/>
        <RouteHandler/>
      </div>
    );
  }
});

module.exports = Containers;
