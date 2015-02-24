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
var path = require('path');
var docker = require('./Docker');
var util = require('./Util');

var Containers = React.createClass({
  mixins: [Router.Navigation, Router.State],
  getInitialState: function () {
    return {
      sidebarOffset: 0,
      containers: ContainerStore.containers(),
      sorted: ContainerStore.sorted(),
      updateAvailable: false,
      currentButtonLabel: ''
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
  onDestroy: function () {
    if (this.state.sorted.length) {
      this.transitionTo('containerHome', {name: this.state.sorted[0].Name});
    } else {
      this.transitionTo('containers');
    }
  },
  update: function (name, status) {
    this.setState({
      containers: ContainerStore.containers(),
      sorted: ContainerStore.sorted()
    });
    if (status === 'destroy') {
      this.onDestroy();
    }
  },
  updateFromClient: function (name, status) {
    this.setState({
      containers: ContainerStore.containers(),
      sorted: ContainerStore.sorted()
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
    ipc.send('command', 'application:quit-install');
  },
  handleClickPreferences: function () {
    this.transitionTo('preferences');
  },
  handleClickDockerTerminal: function () {
    var terminal = path.join(process.cwd(), 'resources', 'terminal');
    var cmd = [terminal, `DOCKER_HOST=${'tcp://' + docker.host + ':2376'} DOCKER_CERT_PATH=${path.join(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'], '.boot2docker/certs/boot2docker-vm')} DOCKER_TLS_VERIFY=1 $SHELL`];
    util.exec(cmd).then(() => {});
  },
  handleClickReportIssue: function () {
    util.exec(['open', 'https://github.com/kitematic/kitematic/issues/new']);
  },
  handleMouseEnterDockerTerminal: function () {
    this.setState({
      currentButtonLabel: 'Open terminal to use Docker CLI.'
    });
  },
  handleMouseLeaveDockerTerminal: function () {
    this.setState({
      currentButtonLabel: ''
    });
  },
  handleMouseEnterReportIssue: function () {
    this.setState({
      currentButtonLabel: 'Report issues or suggest feedbacks.'
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
          <Router.RouteHandler container={container}/>
        </div>
      </div>
    );
  }
});

module.exports = Containers;
