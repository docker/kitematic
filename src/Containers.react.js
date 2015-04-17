var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var ContainerStore = require('./ContainerStore');
var ContainerList = require('./ContainerList.react');
var Header = require('./Header.react');
var ipc = require('ipc');
var remote = require('remote');
var metrics = require('./Metrics');
var autoUpdater = remote.require('auto-updater');
var RetinaImage = require('react-retina-image');
var machine = require('./DockerMachine');
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var Tooltip = require('react-bootstrap').Tooltip;
var shell = require('shell');

var Containers = React.createClass({
  mixins: [Router.Navigation, Router.State],
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

    if (this.state.sorted.length) {
      this.transitionTo('containerHome', {name: this.state.sorted[0].Name});
    }

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
  onDestroy: function () {
    if (this.state.sorted.length) {
      this.transitionTo('containerHome', {name: this.state.sorted[0].Name});
    } else {
      this.transitionTo('containers');
    }
  },
  updateError: function (err) {
    this.setState({
      error: err
    });
  },
  update: function (name, status) {
    this.setState({
      containers: ContainerStore.containers(),
      sorted: ContainerStore.sorted(),
      downloading: ContainerStore.downloading()
    });
    if (status === 'destroy') {
      this.onDestroy();
    }
  },
  updateFromClient: function (name, status) {
    this.setState({
      containers: ContainerStore.containers(),
      sorted: ContainerStore.sorted(),
      downloading: ContainerStore.downloading()
    });
    if (status === 'create') {
      this.transitionTo('containerHome', {name: name});
    } else if (status === 'destroy') {
      this.onDestroy();
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
    this.transitionTo('preferences');
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

    var button;
    if (this.state.downloading) {
      button = (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Only one Docker image can be downloaded at a time.</Tooltip>}>
          <a disabled={true} className="btn-new icon icon-add-3"></a>
        </OverlayTrigger>
      );
    } else {
      button = <a className="btn-new icon icon-add-3" onClick={this.handleNewContainer}></a>;
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
                {button}
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
          <Router.RouteHandler container={container} error={this.state.error}/>
        </div>
      </div>
    );
  }
});

module.exports = Containers;
