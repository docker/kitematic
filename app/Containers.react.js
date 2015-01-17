var React = require('react');
var Router = require('react-router');
var Modal = require('react-bootstrap/Modal');
var RetinaImage = require('react-retina-image');
var ModalTrigger = require('react-bootstrap/ModalTrigger');
var ContainerModal = require('./ContainerModal.react.js');
var ContainerStore = require('./ContainerStore.js');
var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;
var Navigation= Router.Navigation;
var Header = require('./Header.react.js');
var async = require('async');
var _ = require('underscore');
var docker = require('./docker.js');

var ContainerList = React.createClass({
  mixins: [Navigation],
  getInitialState: function () {
    return {
      containers: []
    };
  },
  handleClick: function () {
    console.log('hi');
  },
  componentDidMount: function () {
    ContainerStore.addChangeListener(this.update);
  },
  componentWillUnmount: function () {
    ContainerStore.removeChangeListener(this.update);
  },
  update: function () {
    var containers = _.values(ContainerStore.containers()).sort(function (a, b) {
      return a.Name.localeCompare(b.Name);
    });
    console.log(containers);
    if (containers.length > 0) {
      this.transitionTo('container', {Id: containers[0].Id, container: containers[0]});
    }
    this.setState({
      containers: containers
    });
  },
  render: function () {
    var containers = this.state.containers.map(function (container) {
      var state;
      if (container.State.Running) {
        state = <div className="state state-running"><div className="runningwave"></div></div>;
      } else {
        state = <div className="state state-restarting"></div>;
      }
      return (
        <Link key={container.Id} to="container" params={{Id: container.Id, container: container}} onClick={this.handleClick}>
          <li>
            {state}
            <div className="info">
              <div className="name">
                {container.Name.replace('/', '')}
              </div>
              <div className="image">
                {container.Config.Image}
              </div>
            </div>
          </li>
        </Link>
      );
    });
    return (
      <ul>
        {containers}
      </ul>
    );
  }
});

var Containers = React.createClass({
  getInitialState: function () {
    return {
      sidebarOffset: 0
    };
  },
  handleScroll: function (e) {
    if (e.target.scrollTop > 0 && !this.state.sidebarOffset) {
      this.setState({
        sidebarOffset: e.target.scrollTop
      });
    } else if (e.target.scrollTop === 0 && this.state.sidebarOffset) {
      this.setState({
        sidebarOffset: 0
      });
    }
  },
  handleClick: function () {
    // ContainerStore.create('jbfink/wordpress', 'latest');
  },
  render: function () {
    var sidebarHeaderClass = 'sidebar-header';
    if (this.state.sidebarOffset) {
      sidebarHeaderClass += ' sep';
    }
    return (
      <div className="containers" onClick={this.handleClick}>
        <Header/>
        <div className="containers-body">
          <div className="sidebar">
            <section className={sidebarHeaderClass}>
              <h3>containers</h3>
              <div className="create">
                <ModalTrigger modal={<ContainerModal/>}>
                  <div className="wrapper">
                    <span className="icon icon-add-3"></span>
                  </div>
                </ModalTrigger>
              </div>
            </section>
            <section className="sidebar-containers" onScroll={this.handleScroll}>
              <ContainerList/>
            </section>
          </div>
          <RouteHandler/>
        </div>
      </div>
    );
  }
});

module.exports = Containers;
