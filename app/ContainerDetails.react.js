var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var ContainerStore = require('./ContainerStore');
var docker = require('./docker');
var exec = require('exec');
var boot2docker = require('./boot2docker');
var ProgressBar = require('react-bootstrap/ProgressBar');

var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

var ContainerDetails = React.createClass({
  mixins: [Router.State],
  _oldHeight: 0,
  PAGE_LOGS: 'logs',
  PAGE_SETTINGS: 'settings',
  getInitialState: function () {
    return {
      logs: [],
      page: this.PAGE_LOGS
    };
  },
  componentWillReceiveProps: function () {
    this.setState({
      page: this.PAGE_LOGS
    });
    ContainerStore.fetchLogs(this.getParams().name, function () {
      this.updateLogs();
    }.bind(this));
  },
  componentDidMount: function () {
    ContainerStore.on(ContainerStore.SERVER_PROGRESS_EVENT, this.updateProgress);
    ContainerStore.on(ContainerStore.SERVER_LOGS_EVENT, this.updateLogs);
  },
  componentWillUnmount: function () {
    ContainerStore.removeListener(ContainerStore.SERVER_PROGRESS_EVENT, this.updateProgress);
    ContainerStore.removeListener(ContainerStore.SERVER_LOGS_EVENT, this.updateLogs);
  },
  componentDidUpdate: function () {
    var parent = $('.details-logs');
    if (!parent.length) {
      return;
    }
    if (parent.scrollTop() >= this._oldHeight) {
      parent.stop();
      parent.scrollTop(parent[0].scrollHeight - parent.height());
    }
    this._oldHeight = parent[0].scrollHeight - parent.height();
  },
  updateLogs: function (name) {
    if (name && name !== this.getParams().name) {
      return;
    }
    this.setState({
      logs: ContainerStore.logs(this.getParams().name)
    });
  },
  updateProgress: function (name) {
    console.log('progress', name, ContainerStore.progress(name));
    if (name === this.getParams().name) {
      this.setState({
        progress: ContainerStore.progress(name)
      });
    }
  },
  showLogs: function () {
    this.setState({
      page: this.PAGE_LOGS
    });
  },
  showSettings: function () {
    this.setState({
      page: this.PAGE_SETTINGS
    });
  },
  handleClick: function (name) {
    var container = this.props.container;
    boot2docker.ip(function (err, ip) {
      var ports = _.map(container.NetworkSettings.Ports, function (value, key) {
        var portProtocolPair = key.split('/');
        var res = {
          'port': portProtocolPair[0],
          'protocol': portProtocolPair[1]
        };
        if (value && value.length) {
          var port = value[0].HostPort;
          res.host = ip;
          res.port = port;
          res.url = 'http://' + ip + ':' + port;
        } else {
          return null;
        }
        return res;
      });
      exec(['open', ports[0].url], function (err) {
        if (err) { throw err; }
      });
    });
  },
  render: function () {
    var self = this;

    if (!this.state) {
      return <div></div>;
    }

    var logs = this.state.logs.map(function (l, i) {
      return <p key={i} dangerouslySetInnerHTML={{__html: l}}></p>;
    });

    if (!this.props.container) {
      return false;
    }

    var state;
    if (this.props.container.State.Running) {
      state = <h2 className="status running">running</h2>;
    } else if (this.props.container.State.Restarting) {
      state = <h2 className="status restarting">restarting</h2>;
    } else if (this.props.container.State.Paused) {
      state = <h2 className="status paused">paused</h2>;
    } else if (this.props.container.State.Downloading) {
      state = <h2 className="status">downloading</h2>;
    }

    var button;
    if (this.state.progress === 1) {
      button = <a className="btn btn-primary" onClick={this.handleClick}>View</a>;
    } else {
      button = <a className="btn btn-primary disabled" onClick={this.handleClick}>View</a>;
    }

    var body;
    if (this.props.container.State.Downloading) {
      body = (
        <div className="details-progress">
          <ProgressBar now={this.state.progress * 100} label="%(percent)s%" />
        </div>
      );
    } else {
      if (this.state.page === this.PAGE_LOGS) {
        body = (
          <div className="details-logs">
            <div className="logs">
              {logs}
            </div>
          </div>
        );
      } else {
        body = (
          <div className="details-logs">
            <div className="settings">
            </div>
          </div>
        );
      }
    }

    var name = this.props.container.Name;
    var image = this.props.container.Config.Image;
    var disabledClass = '';
    if (!this.props.container.State.Running) {
      disabledClass = 'disabled';
    }

    var buttonClass = React.addons.classSet({
      btn: true, 'btn-action': true,
      'with-icon': true,
      disabled: !this.props.container.State.Running
    });
    var dropdownButtonClass = React.addons.classSet({
      btn: true,
      'btn-action': true,
      'with-icon': true,
      'dropdown-toggle': true,
      disabled: !this.props.container.State.Running
    });

    var textButtonClasses = React.addons.classSet({
      'btn': true,
      'btn-action': true,
      'only-icon': true,
      'active': this.state.page === this.PAGE_LOGS,
      disabled: !this.props.container.State.Running
    });

    var gearButtonClass = React.addons.classSet({
      'btn': true,
      'btn-action': true,
      'only-icon': true,
      'active': this.state.page === this.PAGE_SETTINGS,
      disabled: !this.props.container.State.Running
    });

    return (
      <div className="details">
        <div className="details-header">
          <div className="details-header-info">
            <h1>{name}</h1>{state}<h2 className="image-label">Image</h2><h2 className="image">{image}</h2>
          </div>
          <div className="details-header-actions">
            <div className="action btn-group">
              <a className={buttonClass} onClick={this.handleClick}><span className="icon icon-preview-2"></span><span className="content">View</span></a><a className={dropdownButtonClass}><span className="icon-dropdown icon icon-arrow-37"></span></a>
            </div>
            <div className="action">
              <a className={dropdownButtonClass} onClick={this.handleClick}><span className="icon icon-folder-1"></span> <span className="content">Volumes</span> <span className="icon-dropdown icon icon-arrow-37"></span></a>
            </div>
            <div className="action">
              <a className={buttonClass} onClick={this.handleClick}><span className="icon icon-refresh"></span> <span className="content">Restart</span></a>
            </div>
            <div className="action">
              <a className={buttonClass} onClick={this.handleClick}><span className="icon icon-window-code-3"></span> <span className="content">Terminal</span></a>
            </div>
            <div className="details-header-actions-rhs tabs btn-group">
              <a className={textButtonClasses} onClick={this.showLogs}><span className="icon icon-text-wrapping-2"></span></a>
              <a className={gearButtonClass} onClick={this.showSettings}><span className="icon icon-setting-gear"></span></a>
            </div>
          </div>
        </div>
        {body}
      </div>
    );
  }
});

module.exports = ContainerDetails;
