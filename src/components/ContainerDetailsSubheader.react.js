var $ = require('jquery');
var _ = require('underscore');
var React = require('react');
var exec = require('exec');
var shell = require('shell');
var metrics = require('../utils/MetricsUtil');
var ContainerUtil = require('../utils/ContainerUtil');
var machine = require('../utils/DockerMachineUtil');
var RetinaImage = require('react-retina-image');
var classNames = require('classnames');
var resources = require('../utils/ResourcesUtil');
var dockerUtil = require('../utils/DockerUtil');
var containerActions = require('../actions/ContainerActions');

var ContainerDetailsSubheader = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  disableRun: function () {
    if (!this.props.container) {
      return false;
    }
    return (!this.props.container.State.Running || !this.props.defaultPort || this.props.container.State.Updating);
  },
  disableRestart: function () {
    if (!this.props.container) {
      return false;
    }
    return (this.props.container.State.Downloading || this.props.container.State.Restarting || this.props.container.State.Updating);
  },
  disableStop: function () {
    if (!this.props.container) {
      return false;
    }
    return (this.props.container.State.Downloading || this.props.container.State.ExitCode || !this.props.container.State.Running || this.props.container.State.Updating);
  },
  disableStart: function () {
    if (!this.props.container) {
      return false;
    }
    return (this.props.container.State.Downloading || this.props.container.State.Running || this.props.container.State.Updating);
  },
  disableTerminal: function () {
    if (!this.props.container) {
      return false;
    }
    return (!this.props.container.State.Running || this.props.container.State.Updating);
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
    if (this.props.defaultPort && !this.disableRun()) {
      metrics.track('Opened In Browser', {
        from: 'header'
      });
      shell.openExternal(this.props.ports[this.props.defaultPort].url);
    }
  },
  handleRestart: function () {
    if (!this.disableRestart()) {
      metrics.track('Restarted Container');
      //dockerUtil.restart(this.props.container.Name);
      containerActions.restart(this.props.container.Name);
    }
  },
  handleStop: function () {
    if (!this.disableStop()) {
      metrics.track('Stopped Container');
      containerActions.stop(this.props.container.Name);
    }
  },
  handleStart: function () {
    if (!this.disableStart()) {
      metrics.track('Started Container');
      containerActions.start(this.props.container.Name);
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

    var currentRoutes = _.map(this.context.router.getCurrentRoutes(), r => r.name);
    var currentRoute = _.last(currentRoutes);

    var tabHomeClasses = classNames({
      'tab': true,
      'active': currentRoute === 'containerHome',
      disabled: this.disableTab()
    });
    var tabLogsClasses = classNames({
      'tab': true,
      'active': currentRoute === 'containerLogs',
      disabled: this.disableTab()
    });
    var tabSettingsClasses = classNames({
      'tab': true,
      'active': currentRoutes && (currentRoutes.indexOf('containerSettings') >= 0),
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
          {startStopToggle}
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
