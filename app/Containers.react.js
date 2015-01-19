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

  },
  componentDidMount: function () {
    this.update();
    ContainerStore.addChangeListener(this.update);
    if (this.state.containers.length > 0) {
      this.transitionTo('container', {Id: this.state.containers[0].Id});
    }
  },
  componentWillMount: function () {
    this._start = Date.now();
  },
  componentWillUnmount: function () {
    ContainerStore.removeChangeListener(this.update);
  },
  update: function () {
    var containers = _.values(ContainerStore.containers()).sort(function (a, b) {
      return a.Name.localeCompare(b.Name);
    });
    this.setState({
      containers: containers
    });
  },
  render: function () {
    var self = this;
    var containers = this.state.containers.map(function (container) {
      var downloadingImage = null, downloading = false;
      var env = container.Config.Env;
      if (env.length) {
        var obj = _.object(env.map(function (e) {
          return e.split('=');
        }));
        if (obj.KITEMATIC_DOWNLOADING) {
          downloading = true;
        }
        downloadingImage = obj.KITEMATIC_DOWNLOADING_IMAGE || null;
      }

      var imageName = downloadingImage || container.Config.Image;

      var state;

      // Synchronize all animations
      var style = {
        WebkitAnimationDelay: (self._start - Date.now()) + 'ms'
      };

      if (downloading) {
        state = <div className="state state-downloading"><div style={style} className="downloading-arrow"></div></div>;
      } else if (container.State.Running && !container.State.Paused) {
        state = <div className="state state-running"><div style={style} className="runningwave"></div></div>;
      } else if (container.State.Restarting) {
        state = <div className="state state-restarting" style={style}></div>;
      } else if (container.State.Paused) {
        state = <div className="state state-paused"></div>;
      } else if (container.State.ExitCode) {
        // state = <div className="state state-error"></div>;
        state = <div className="state state-stopped"></div>;
      } else {
        state = <div className="state state-stopped"></div>;
      }
      return (
        <Link key={container.Id} to="container" params={{Id: container.Id}} onClick={this.handleClick}>
          <li>
            {state}
            <div className="info">
              <div className="name">
                {container.Name.replace('/', '')}
              </div>
              <div className="image">
                {imageName}
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
    ContainerStore.create('dockerfile/ghost', 'latest', 'testghost');
  },
  render: function () {
    var sidebarHeaderClass = 'sidebar-header';
    if (this.state.sidebarOffset) {
      sidebarHeaderClass += ' sep';
    }
    return (
      <div className="containers">
        <Header/>
        <div className="containers-body">
          <div className="sidebar">
            <section className={sidebarHeaderClass}>
              <h3 onClick={this.handleClick}>containers</h3>
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
