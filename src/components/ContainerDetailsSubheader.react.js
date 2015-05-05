var _ = require('underscore');
var $ = require('jquery');
var React = require('react');
var exec = require('exec');
var shell = require('shell');
var metrics = require('../utils/MetricsUtil');
var ContainerStore = require('../stores/ContainerStore');
var ContainerUtil = require('../utils/ContainerUtil');
var machine = require('../utils/DockerMachineUtil');
var RetinaImage = require('react-retina-image');
var webPorts = require('../utils/Util').webPorts;
var classNames = require('classnames');
var resources = require('../utils/ResourcesUtil');

var ContainerDetailsSubheader = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    return {
      defaultPort: null
    };
  },
  componentWillReceiveProps: function () {
    this.init();
  },
  componentDidMount: function () {
    this.init();
  },
  init: function () {
    this.setState({
      currentRoute: _.last(this.context.router.getCurrentRoutes()).name
    });
    var container = ContainerStore.container(this.context.router.getCurrentParams().name);
    if (!container) {
      return;
    }
    var ports = ContainerUtil.ports(container);
    this.setState({
      ports: ports,
      defaultPort: _.find(_.keys(ports), function (port) {
        return webPorts.indexOf(port) !== -1;
      })
    });
  },
  disableRun: function () {
    if (!this.props.container) {
      return false;
    }
    return (!this.props.container.State.Running || !this.state.defaultPort);
  },
  disableRestart: function () {
    if (!this.props.container) {
      return false;
    }
    return (this.props.container.State.Downloading || this.props.container.State.Restarting);
  },
  disableStop: function () {
    if (!this.props.container) {
      return false;
    }
    return (this.props.container.State.Downloading || this.props.container.State.ExitCode || !this.props.container.State.Running);
  },
  disableStart: function () {
    if (!this.props.container) {
      return false;
    }
    return (this.props.container.State.Downloading || this.props.container.State.Running);
  },
  disableTerminal: function () {
    if (!this.props.container) {
      return false;
    }
    return (!this.props.container.State.Running);
  },
  disableTab: function () {
    if (!this.props.container) {
      return false;
    }
    return (this.props.container.State.Downloading);
  },
  showHome: function () {
    if (!this.disableTab()) {
      metrics.track('Viewed Home', {
        from: 'header'
      });
      this.context.router.transitionTo('containerHome', {name: this.context.router.getCurrentParams().name});
    }
  },
  showLogs: function () {
    if (!this.disableTab()) {
      metrics.track('Viewed Logs');
      this.context.router.transitionTo('containerLogs', {name: this.context.router.getCurrentParams().name});
    }
  },
  showSettings: function () {
    if (!this.disableTab()) {
      metrics.track('Viewed Settings');
      this.context.router.transitionTo('containerSettings', {name: this.context.router.getCurrentParams().name});
    }
  },
  handleRun: function () {
    if (this.state.defaultPort && !this.disableRun()) {
      metrics.track('Opened In Browser', {
        from: 'header'
      });
      shell.openExternal(this.state.ports[this.state.defaultPort].url);
    }
  },
  handleRestart: function () {
    if (!this.disableRestart()) {
      metrics.track('Restarted Container');
      ContainerStore.restart(this.props.container.Name, function () {
      });
    }
  },
  handleStop: function () {
    if (!this.disableStop()) {
      metrics.track('Stopped Container');
      ContainerStore.stop(this.props.container.Name, function () {
      });
    }
  },
  handleStart: function () {
    if (!this.disableStart()) {
      metrics.track('Started Container');
      ContainerStore.start(this.props.container.Name, function () {
      });
    }
  },
  handleTerminal: function () {
    if (!this.disableTerminal()) {
      metrics.track('Terminaled Into Container');
      var container = this.props.container;
      var shell = ContainerUtil.env(container).SHELL;
      if(typeof shell === 'undefined') {
        shell = 'sh';
      }
      machine.ip().then(ip => {
        var cmd = [resources.terminal(), 'ssh', '-p', '22', '-o', 'UserKnownHostsFile=/dev/null', '-o', 'LogLevel=quiet', '-o', 'StrictHostKeyChecking=no', '-i', '~/.docker/machine/machines/' + machine.name() + '/id_rsa', 'docker@' + ip, '-t', 'docker', 'exec', '-i', '-t', container.Name, shell];
        exec(cmd, function (stderr, stdout, code) {
          if (code) {
            console.log(stderr);
          }
        });
      });
    }
  },
  handleItemMouseEnterView: function () {
    var $action = $(this.getDOMNode()).find('.action .view');
    $action.css("visibility", "visible");
  },
  handleItemMouseLeaveView: function () {
    var $action = $(this.getDOMNode()).find('.action .view');
    $action.css("visibility", "hidden");
  },
  handleItemMouseEnterRestart: function () {
    var $action = $(this.getDOMNode()).find('.action .restart');
    $action.css("visibility", "visible");
  },
  handleItemMouseLeaveRestart: function () {
    var $action = $(this.getDOMNode()).find('.action .restart');
    $action.css("visibility", "hidden");
  },
  handleItemMouseEnterStop: function () {
    var $action = $(this.getDOMNode()).find('.action .stop');
    $action.css("visibility", "visible");
  },
  handleItemMouseLeaveStop: function () {
    var $action = $(this.getDOMNode()).find('.action .stop');
    $action.css("visibility", "hidden");
  },
  handleItemMouseEnterStart: function () {
    var $action = $(this.getDOMNode()).find('.action .start');
    $action.css("visibility", "visible");
  },
  handleItemMouseLeaveStart: function () {
    var $action = $(this.getDOMNode()).find('.action .start');
    $action.css("visibility", "hidden");
  },
  handleItemMouseEnterTerminal: function () {
    var $action = $(this.getDOMNode()).find('.action .terminal');
    $action.css("visibility", "visible");
  },
  handleItemMouseLeaveTerminal: function () {
    var $action = $(this.getDOMNode()).find('.action .terminal');
    $action.css("visibility", "hidden");
  },
  render: function () {
    var runActionClass = classNames({
      action: true,
      disabled: this.disableRun()
    });
    var restartActionClass = classNames({
      action: true,
      disabled: this.disableRestart()
    });
    var stopActionClass = classNames({
      action: true,
      disabled: this.disableStop()
    });
    var startActionClass = classNames({
      action: true,
      disabled: this.disableStart()
    });
    var terminalActionClass = classNames({
      action: true,
      disabled: this.disableTerminal()
    });
    var tabHomeClasses = classNames({
      'tab': true,
      'active': this.state.currentRoute === 'containerHome',
      disabled: this.disableTab()
    });
    var tabLogsClasses = classNames({
      'tab': true,
      'active': this.state.currentRoute === 'containerLogs',
      disabled: this.disableTab()
    });
    var tabSettingsClasses = classNames({
      'tab': true,
      'active': this.state.currentRoute && (this.state.currentRoute.indexOf('containerSettings') >= 0),
      disabled: this.disableTab()
    });
    var startStopToggle;
    if (this.disableStop()) {
      startStopToggle = (
        <div className={startActionClass} onMouseEnter={this.handleItemMouseEnterStart} onMouseLeave={this.handleItemMouseLeaveStart}>
          <div className="action-icon" onClick={this.handleStart}><RetinaImage src="button-start.png" /></div>
          <span className="btn-label start">Start</span>
        </div>
      );
    } else {
      startStopToggle = (
        <div className={stopActionClass} onMouseEnter={this.handleItemMouseEnterStop} onMouseLeave={this.handleItemMouseLeaveStop}>
          <div className="action-icon" onClick={this.handleStop}><RetinaImage src="button-stop.png" /></div>
          <span className="btn-label stop">Stop</span>
        </div>
      );
    }
    return (
      <div className="details-subheader">
        <div className="details-header-actions">
          <div className={runActionClass} onMouseEnter={this.handleItemMouseEnterView} onMouseLeave={this.handleItemMouseLeaveView}>
            <div className="action-icon" onClick={this.handleRun}><RetinaImage src="button-view.png"/></div>
            <span className="btn-label view">View</span>
          </div>
          <div className={restartActionClass} onMouseEnter={this.handleItemMouseEnterRestart} onMouseLeave={this.handleItemMouseLeaveRestart}>
            <div className="action-icon" onClick={this.handleRestart}><RetinaImage src="button-restart.png"/></div>
            <span className="btn-label restart">Restart</span>
          </div>
          {{startStopToggle}}
          <div className={terminalActionClass} onMouseEnter={this.handleItemMouseEnterTerminal} onMouseLeave={this.handleItemMouseLeaveTerminal}>
            <div className="action-icon" onClick={this.handleTerminal}><RetinaImage src="button-terminal.png"/></div>
            <span className="btn-label terminal">Terminal</span>
          </div>
        </div>
        <div className="details-subheader-tabs">
          <span className={tabHomeClasses} onClick={this.showHome}>Home</span>
          <span className={tabLogsClasses} onClick={this.showLogs}>Logs</span>
          <span className={tabSettingsClasses} onClick={this.showSettings}>Settings</span>
        </div>
      </div>
    );
  }
});

module.exports = ContainerDetailsSubheader;
