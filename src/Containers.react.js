var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var ContainerStore = require('./ContainerStore');
var ContainerList = require('./ContainerList.react');
var Header = require('./Header.react');
var ipc = require('ipc');
var remote = require('remote');
var autoUpdater = remote.require('auto-updater');

var Containers = React.createClass({
  mixins: [Router.Navigation, Router.State],
  getInitialState: function () {
    return {
      sidebarOffset: 0,
      containers: ContainerStore.containers(),
      sorted: ContainerStore.sorted(),
      updateAvailable: false
    };
  },
  componentDidMount: function () {
    this.update();
    ContainerStore.on(ContainerStore.SERVER_CONTAINER_EVENT, this.update);
    ContainerStore.on(ContainerStore.CLIENT_CONTAINER_EVENT, this.updateFromClient);

    if (this.state.sorted.length) {
      this.transitionTo('containerHome', {name: this.state.sorted[0].Name});
    }

    autoUpdater.checkForUpdates();
    ipc.on('notify', function (message) {
      if (message === 'window:update-available') {
        this.setState({
          updateAvailable: true
        });
      }
    });
  },
  componentDidUnmount: function () {
    ContainerStore.removeListener(ContainerStore.SERVER_CONTAINER_EVENT, this.update);
    ContainerStore.removeListener(ContainerStore.CLIENT_CONTAINER_EVENT, this.updateFromClient);
  },
  update: function (name, status) {
    this.setState({
      containers: ContainerStore.containers(),
      sorted: ContainerStore.sorted()
    });
    if (status === 'destroy') {
      if (this.state.sorted.length) {
        this.transitionTo('containerHome', {name: this.state.sorted[0].Name});
      } else {
        this.transitionTo('containers');
      }
    }
  },
  updateFromClient: function (name, status) {
    this.setState({
      containers: ContainerStore.containers(),
      sorted: ContainerStore.sorted()
    });
    if (status === 'create') {
      this.transitionTo('containerHome', {name: name});
    }
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
  handleNewContainer: function () {
    $(this.getDOMNode()).find('.new-container-item').parent().fadeIn();
    this.transitionTo('new');
  },
  handleAutoUpdateClick: function () {
    console.log('CLICKED UPDATE');
    ipc.send('command', 'application:quit-install');
  },
  render: function () {
    var sidebarHeaderClass = 'sidebar-header';
    if (this.state.sidebarOffset) {
      sidebarHeaderClass += ' sep';
    }
    var updateNotification;
    var updatePadding;
    if (this.state.updateAvailable) {
      updateNotification = (
        <div className="update-notification"><span className="text">Update Available</span><a className="btn btn-action small" onClick={this.handleAutoUpdateClick}>Update Now</a></div>
      );
      updatePadding = (
        <div className="update-padding"></div>
      );
    }
    var container = this.getParams().name ? this.state.containers[this.getParams().name] : {};
    return (
      <div className="containers">
        <Header />
        <div className="containers-body">
          <div className="sidebar">
            <section className={sidebarHeaderClass}>
              <h4>Containers</h4>
              <div className="create">
                <span className="btn-new icon icon-add-3" onClick={this.handleNewContainer}></span>
              </div>
            </section>
            <section className="sidebar-containers" onScroll={this.handleScroll}>
              <ContainerList containers={this.state.sorted} newContainer={this.state.newContainer} />
              {updatePadding}
              {updateNotification}
            </section>
          </div>
          <Router.RouteHandler container={container}/>
        </div>
      </div>
    );
  }
});

module.exports = Containers;
