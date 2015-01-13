var React = require('react');
var Router = require('react-router');
var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;
var Navigation= Router.Navigation;

var Header = require('./Header.react.js');

var async = require('async');
var docker = require('./docker.js');


var ContainerList = React.createClass({
  render: function () {
    var containers = this.props.containers.map(function (container) {
      var state;
      if (container.State.Running) {
        state = <span className="status">running</span>;
      } else if (container.State.Restarting) {
        state = <span className="status">restarting</span>;
      }

      return (
        <Link key={container.Id} to="container" params={{Id: container.Id, container: container}}>
          <li>
            <div className="name">
              {container.Name.replace('/', '')}
            </div>
            <div className="image">
              {state} - {container.Config.Image}
            </div>
          </li>
        </Link>
      );
    });
    return (
      <ul className="container-list">
        {containers}
      </ul>
    );
  }
});

var Containers = React.createClass({
  mixins: [Navigation],
  getInitialState: function() {
    return {containers: [], index: null};
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
          self.transitionTo('container', {Id: results[0].Id, container: results[0]});
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
      <div className="containers">
        <Header/>
        <div className="containers-body">
          <div className="sidebar">
            <ContainerList containers={this.state.containers}/>
          </div>
          <div className="details container">
            <RouteHandler containers={this.state.containers}/>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Containers;
