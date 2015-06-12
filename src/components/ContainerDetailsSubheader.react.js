var _ = require('underscore');
var React = require('react');
var exec = require('exec');
var shell = require('shell');
var metrics = require('../utils/MetricsUtil');
var ContainerUtil = require('../utils/ContainerUtil');
var util = require('../utils/Util');
var machine = require('../utils/DockerMachineUtil');
var classNames = require('classnames');
var resources = require('../utils/ResourcesUtil');
var containerActions = require('../actions/ContainerActions');
var dockerMachineUtil = require('../utils/DockerMachineUtil');

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
      var shell = ContainerUtil.env(container).reduce((envs, env) => {
        envs[env[0]] = env[1];
        return envs;
      }, {}).SHELL;

      if(!shell) {
        shell = 'sh';
      }
      dockerMachineUtil.dockerTerminal(`docker exec -it ${this.props.container.Name} ${shell}`);
    }
  },
  render: function () {
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
      'details-tab': true,
      'active': currentRoute === 'containerHome',
      disabled: this.disableTab()
    });
    var tabSettingsClasses = classNames({
      'details-tab': true,
      'active': currentRoutes && (currentRoutes.indexOf('containerSettings') >= 0),
      disabled: this.disableTab()
    });
    var startStopToggle;
    if (this.disableStop()) {
      startStopToggle = (
        <div className={startActionClass}>
          <div className="action-icon start" onClick={this.handleStart}><span className="icon icon-start"></span></div>
          <div className="btn-label">START</div>
        </div>
      );
    } else {
      startStopToggle = (
        <div className={stopActionClass}>
          <div className="action-icon stop" onClick={this.handleStop}><span className="icon icon-stop"></span></div>
          <div className="btn-label">STOP</div>
        </div>
      );
    }
    return (
      <div className="details-subheader">
        <div className="details-header-actions">
          {startStopToggle}
          <div className={restartActionClass}>
            <div className="action-icon" onClick={this.handleRestart}><span className="icon icon-restart"></span></div>
            <div className="btn-label">RESTART</div>
          </div>
          <div className={terminalActionClass}>
            <div className="action-icon" onClick={this.handleTerminal}><span className="icon icon-docker-exec"></span></div>
            <div className="btn-label">EXEC</div>
          </div>
        </div>
        <div className="details-subheader-tabs">
          <span className={tabHomeClasses} onClick={this.showHome}>Home</span>
          <span className={tabSettingsClasses} onClick={this.showSettings}>Settings</span>
        </div>
      </div>
    );
  }
});

module.exports = ContainerDetailsSubheader;
