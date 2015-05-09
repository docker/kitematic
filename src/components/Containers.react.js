var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var ContainerStore = require('../stores/ContainerStore');
var ContainerList = require('./ContainerList.react');
var Header = require('./Header.react');
var ipc = require('ipc');
var remote = require('remote');
var metrics = require('../utils/MetricsUtil');
var autoUpdater = remote.require('auto-updater');
var RetinaImage = require('react-retina-image');
var shell = require('shell');
var machine = require('../utils/DockerMachineUtil');

var Containers = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    return {
      sidebarOffset: 0,
      containers: ContainerStore.containers(),
      sorted: ContainerStore.sorted(),
      updateAvailable: false,
      currentButtonLabel: '',
      error: ContainerStore.error(),
      downloading: ContainerStore.downloading()
    };
  },
  componentDidMount: function () {
    this.update();
    ContainerStore.on(ContainerStore.SERVER_ERROR_EVENT, this.updateError);
    ContainerStore.on(ContainerStore.SERVER_CONTAINER_EVENT, this.update);
    ContainerStore.on(ContainerStore.CLIENT_CONTAINER_EVENT, this.updateFromClient);

    ipc.on('application:update-available', () => {
      this.setState({
        updateAvailable: true
      });
    });
    autoUpdater.checkForUpdates();
  },
  componentDidUnmount: function () {
    ContainerStore.removeListener(ContainerStore.SERVER_CONTAINER_EVENT, this.update);
    ContainerStore.removeListener(ContainerStore.CLIENT_CONTAINER_EVENT, this.updateFromClient);
  },
  updateError: function (err) {
    this.setState({
      error: err
    });
  },
  update: function (name, status) {
    var sorted = ContainerStore.sorted();
    this.setState({
      containers: ContainerStore.containers(),
      sorted: sorted,
      pending: ContainerStore.pending(),
      downloading: ContainerStore.downloading()
    });
    if (status === 'destroy') {
      if (sorted.length) {
        this.context.router.transitionTo('containerHome', {name: sorted[0].Name});
      } else {
        this.context.router.transitionTo('containers');
      }
    }
  },
  updateFromClient: function (name, status) {
    this.update(name, status);
    if (status === 'create') {
      this.context.router.transitionTo('containerHome', {name: name});
    } else if (status === 'pending' && ContainerStore.pending()) {
      this.context.router.transitionTo('pull');
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
    this.context.router.transitionTo('new');
    metrics.track('Pressed New Container');
  },
  handleAutoUpdateClick: function () {
    metrics.track('Restarted to Update');
    ipc.send('application:quit-install');
  },
  handleClickPreferences: function () {
    metrics.track('Opened Preferences', {
      from: 'app'
    });
    this.context.router.transitionTo('preferences');
  },
  handleClickDockerTerminal: function () {
    metrics.track('Opened Docker Terminal', {
      from: 'app'
    });
    machine.dockerTerminal();
  },
  handleClickReportIssue: function () {
    metrics.track('Opened Issue Reporter', {
      from: 'app'
    });
    shell.openExternal('https://github.com/kitematic/kitematic/issues/new');
  },
  handleMouseEnterDockerTerminal: function () {
    this.setState({
      currentButtonLabel: 'Open terminal to use Docker command line.'
    });
  },
  handleMouseLeaveDockerTerminal: function () {
    this.setState({
      currentButtonLabel: ''
    });
  },
  handleMouseEnterReportIssue: function () {
    this.setState({
      currentButtonLabel: 'Report an issue or suggest feedback.'
    });
  },
  handleMouseLeaveReportIssue: function () {
    this.setState({
      currentButtonLabel: ''
    });
  },
  handleMouseEnterPreferences: function () {
    this.setState({
      currentButtonLabel: 'Change app preferences.'
    });
  },
  handleMouseLeavePreferences: function () {
    this.setState({
      currentButtonLabel: ''
    });
  },
  render: function () {
    var sidebarHeaderClass = 'sidebar-header';
    if (this.state.sidebarOffset) {
      sidebarHeaderClass += ' sep';
    }
    var updateWidget;
    if (this.state.updateAvailable) {
      updateWidget = (
        <a className="btn btn-action small" onClick={this.handleAutoUpdateClick}>New Update</a>
      );
    }

    var container = this.context.router.getCurrentParams().name ? this.state.containers[this.context.router.getCurrentParams().name] : {};
    return (
      <div className="containers">
        <Header />
        <div className="containers-body">
          <div className="sidebar">
            <section className={sidebarHeaderClass}>
              <h4>Containers</h4>
              <div className="create">
                <a className="btn-new icon icon-add-3" onClick={this.handleNewContainer}></a>
              </div>
            </section>
            <section className="sidebar-containers" onScroll={this.handleScroll}>
              <ContainerList downloading={this.state.downloading} containers={this.state.sorted} newContainer={this.state.newContainer} />
              <div className="sidebar-buttons">
                <div className="btn-label">{this.state.currentButtonLabel}</div>
                <span className="btn-sidebar" onClick={this.handleClickDockerTerminal} onMouseEnter={this.handleMouseEnterDockerTerminal} onMouseLeave={this.handleMouseLeaveDockerTerminal}><RetinaImage src="docker-terminal.png"/></span>
                <span className="btn-sidebar" onClick={this.handleClickReportIssue} onMouseEnter={this.handleMouseEnterReportIssue} onMouseLeave={this.handleMouseLeaveReportIssue}><RetinaImage src="report-issue.png"/></span>
                <span className="btn-sidebar" onClick={this.handleClickPreferences} onMouseEnter={this.handleMouseEnterPreferences} onMouseLeave={this.handleMouseLeavePreferences}><RetinaImage src="preferences.png"/></span>
                {updateWidget}
              </div>
              <div className="sidebar-buttons-padding"></div>
            </section>
          </div>
          <Router.RouteHandler pending={this.state.pending} container={container} error={this.state.error}/>
        </div>
      </div>
    );
  }
});

module.exports = Containers;
