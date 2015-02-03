var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var exec = require('exec');
var path =  require('path');
var remote = require('remote');
var dialog = remote.require('dialog');
var ContainerStore = require('./ContainerStore');
var ContainerUtil = require('./ContainerUtil');
var boot2docker = require('./Boot2Docker');
var ProgressBar = require('react-bootstrap/ProgressBar');
var ContainerDetailsHeader = require('./ContainerDetailsHeader.react');
var ContainerHome = require('./ContainerHome.react');

var ContainerDetails = React.createClass({
  mixins: [Router.State, Router.Navigation],
  _oldHeight: 0,
  PAGE_HOME: 'home',
  PAGE_LOGS: 'logs',
  PAGE_SETTINGS: 'settings',
  PAGE_PORTS: 'ports',
  PAGE_VOLUMES: 'volumes',
  getInitialState: function () {
    return {
      logs: [],
      page: this.PAGE_HOME,
      env: {},
      pendingEnv: {},
      ports: {},
      defaultPort: null,
      volumes: {}
    };
  },
  componentWillReceiveProps: function () {
    this.init();
  },
  componentDidMount: function () {
    this.init();
    ContainerStore.on(ContainerStore.SERVER_PROGRESS_EVENT, this.updateProgress);
    ContainerStore.on(ContainerStore.SERVER_LOGS_EVENT, this.updateLogs);
  },
  componentWillUnmount: function () {
    ContainerStore.removeListener(ContainerStore.SERVER_PROGRESS_EVENT, this.updateProgress);
    ContainerStore.removeListener(ContainerStore.SERVER_LOGS_EVENT, this.updateLogs);
  },
  componentDidUpdate: function () {
    // Scroll logs to bottom
    var parent = $('.details-logs');
    if (parent.length) {
      if (parent.scrollTop() >= this._oldHeight) {
        parent.stop();
        parent.scrollTop(parent[0].scrollHeight - parent.height());
      }
      this._oldHeight = parent[0].scrollHeight - parent.height();
    }
  },
  init: function () {
    var container = ContainerStore.container(this.getParams().name);
    if (!container) {
      return;
    }
    this.setState({
      progress: ContainerStore.progress(this.getParams().name),
      env: ContainerUtil.env(container),
    });
    var ports = ContainerUtil.ports(container);
    var webPorts = ['80', '8000', '8080', '3000', '5000', '2368'];
    console.log(ports);
    this.setState({
      ports: ports,
      defaultPort: _.find(_.keys(ports), function (port) {
        return webPorts.indexOf(port) !== -1;
      })
    });
    console.log(this.state);
    this.updateLogs();
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
    if (name === this.getParams().name) {
      this.setState({
        progress: ContainerStore.progress(name)
      });
    }
  },
  showHome: function () {
    this.setState({
      page: this.PAGE_HOME
    });
  },
  showLogs: function () {
    this.setState({
      page: this.PAGE_LOGS
    });
  },
  showPorts: function () {
    this.setState({
      page: this.PAGE_PORTS
    });
  },
  showVolumes: function () {
    this.setState({
      page: this.PAGE_VOLUMES
    });
  },
  showSettings: function () {
    this.setState({
      page: this.PAGE_SETTINGS
    });
  },
  handleView: function () {
    console.log('CLICKED');
    console.log(this.state.ports);
    console.log(this.state.defaultPort);
    if (this.state.defaultPort) {
      console.log(this.state.defaultPort);
      console.log(this.state.ports[this.state.defaultPort].url);
      exec(['open', this.state.ports[this.state.defaultPort].url], function (err) {
        if (err) { throw err; }
      });
    }
  },
  handleViewLink: function (url) {
    exec(['open', url], function (err) {
      if (err) { throw err; }
    });
  },
  handleRestart: function () {
    ContainerStore.restart(this.props.container.Name, function (err) {
      console.log(err);
    });
  },
  handleTerminal: function () {
    var container = this.props.container;
    var terminal = path.join(process.cwd(), 'resources', 'terminal').replace(/ /g, '\\\\ ');
    var cmd = [terminal, boot2docker.command().replace(/ /g, '\\\\ '), 'ssh', '-t', 'sudo', 'docker', 'exec', '-i', '-t', container.Name, 'bash'];
    exec(cmd, function (stderr, stdout, code) {
      if (code) {
        console.log(stderr);
      }
    });
  },
  handleSaveContainerName: function () {
    var newName = $('#input-container-name').val();
    ContainerStore.updateContainer(this.props.container.Name, {
      name: newName
    }, function (err) {
      this.transitionTo('container', {name: newName});
      if (err) {
        console.error(err);
      }
    }.bind(this));
  },
  handleSaveEnvVar: function () {
    var $rows = $('.env-vars .keyval-row');
    var envVarList = [];
    $rows.each(function () {
      var key = $(this).find('.key').val();
      var val = $(this).find('.val').val();
      if (!key.length || !val.length) {
        return;
      }
      envVarList.push(key + '=' + val);
    });
    var self = this;
    ContainerStore.updateContainer(self.props.container.Name, {
      Env: envVarList
    }, function (err) {
      if (err) {
        console.error(err);
      } else {
        self.setState({
          pendingEnv: {}
        });
        $('#new-env-key').val('');
        $('#new-env-val').val('');
      }
    });
  },
  handleAddPendingEnvVar: function () {
    var newKey = $('#new-env-key').val();
    var newVal = $('#new-env-val').val();
    var newEnv = {};
    newEnv[newKey] = newVal;
    this.setState({
      pendingEnv: _.extend(this.state.pendingEnv, newEnv)
    });
    $('#new-env-key').val('');
    $('#new-env-val').val('');
  },
  handleRemoveEnvVar: function (key) {
    var newEnv = _.omit(this.state.env, key);
    this.setState({
      env: newEnv
    });
  },
  handleRemovePendingEnvVar: function (key) {
    var newEnv = _.omit(this.state.pendingEnv, key);
    this.setState({
      pendingEnv: newEnv
    });
  },
  handleDeleteContainer: function () {
    dialog.showMessageBox({
      message: 'Are you sure you want to delete this container?',
      buttons: ['Delete', 'Cancel']
    }, function (index) {
      if (index === 0) {
        ContainerStore.remove(this.props.container.Name, function (err) {
          console.error(err);
        });
      }
    }.bind(this));
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

    var button;
    if (this.state.progress === 1) {
      button = <a className="btn btn-primary" onClick={this.handleClick}>View</a>;
    } else {
      button = <a className="btn btn-primary disabled" onClick={this.handleClick}>View</a>;
    }

    var envVars = _.map(this.state.env, function (val, key) {
      return (
        <div key={key} className="keyval-row">
          <input type="text" className="key line" defaultValue={key}></input>
          <input type="text" className="val line" defaultValue={val}></input>
          <a onClick={self.handleRemoveEnvVar.bind(self, key)} className="only-icon btn btn-action small"><span className="icon icon-cross"></span></a>
        </div>
      );
    });
    var pendingEnvVars = _.map(this.state.pendingEnv, function (val, key) {
      return (
        <div key={key} className="keyval-row">
          <input type="text" className="key line" defaultValue={key}></input>
          <input type="text" className="val line" defaultValue={val}></input>
          <a onClick={self.handleRemovePendingEnvVar.bind(self, key)} className="only-icon btn btn-action small"><span className="icon icon-arrow-undo"></span></a>
        </div>
      );
    });

    var disabledClass = '';
    if (!this.props.container.State.Running) {
      disabledClass = 'disabled';
    }

    /*var buttonClass = React.addons.classSet({
      btn: true,
      'btn-action': true,
      'with-icon': true,
      disabled: !this.props.container.State.Running
    });

    var restartButtonClass = React.addons.classSet({
      btn: true,
      'btn-action': true,
      'with-icon': true,
      disabled: this.props.container.State.Restarting
    });

    var viewButtonClass = React.addons.classSet({
      btn: true,
      'btn-action': true,
      'with-icon': true,
      disabled: !this.props.container.State.Running || !this.state.defaultPort
    });

    var textButtonClasses = React.addons.classSet({
      'btn': true,
      'btn-action': true,
      'only-icon': true,
      'active': this.state.page === this.PAGE_LOGS,
      disabled: this.props.container.State.Downloading
    });

    var gearButtonClass = React.addons.classSet({
      'btn': true,
      'btn-action': true,
      'only-icon': true,
      'active': this.state.page === this.PAGE_SETTINGS,
      disabled: this.props.container.State.Downloading
    });*/

    var ports = _.map(_.pairs(self.state.ports), function (pair) {
      var key = pair[0];
      var val = pair[1];
      return (
        <div key={key} className="table-values">
        <span className="value-left">{key}</span><span className="icon icon-arrow-right"></span>
        <a className="value-right" onClick={self.handleViewLink.bind(self, val.url)}>{val.display}</a>
        </div>
      );
    });

    var volumes = _.map(self.props.container.Volumes, function (val, key) {
      if (!val || val.indexOf(process.env.HOME) === -1) {
        val = 'No Host Folder';
      }
      return (
        <div key={key} className="table-values">
        <span className="value-left">{key}</span><span className="icon icon-arrow-right"></span>
        <a className="value-right">{val.replace(process.env.HOME, '~')}</a>
        </div>
      );
    });

    var body;
    if (this.props.container.State.Downloading) {
      body = (
        <div className="details-progress">
          <ProgressBar now={this.state.progress * 100} label="%(percent)s%" />
        </div>
      );
    } else {
      if (this.state.page === this.PAGE_HOME) {
        body = (
          <ContainerHome />
        );
      } else if (this.state.page === this.PAGE_LOGS) {
        body = (
          <div className="details-panel details-logs">
            <div className="logs">
              {logs}
            </div>
          </div>
        );
      } else if (this.state.page === this.PAGE_PORTS) {
        body = (
          <div className="details-panel">
            <div className="ports">
              <h3>Configure Ports</h3>
              <div className="table">
                <div className="table-labels">
                  <div className="label-left">DOCKER PORT</div>
                  <div className="label-right">MAC PORT</div>
                </div>
                {ports}
              </div>
            </div>
          </div>
        );
      } else if (this.state.page === this.PAGE_VOLUMES) {
        body = (
          <div className="details-panel">
            <div className="volumes">
              <h3>Configure Volumes</h3>
              <div className="table">
                <div className="table-labels">
                  <div className="label-left">DOCKER FOLDER</div>
                  <div className="label-right">MAC FOLDER</div>
                </div>
                {volumes}
              </div>
            </div>
          </div>
        );
      } else {
        body = (
          <div className="details-panel">
            <div className="settings">
              <div className="settings-section">
                <h3>Container Name</h3>
                <div className="container-name">
                  <input id="input-container-name" type="text" className="line" placeholder="Container Name" defaultValue={this.props.container.Name}></input>
                </div>
                <a className="btn btn-action" onClick={this.handleSaveContainerName}>Save</a>
              </div>
              <div className="settings-section">
                <h3>Environment Variables</h3>
                <div className="env-vars-labels">
                  <div className="label-key">KEY</div>
                  <div className="label-val">VALUE</div>
                </div>
                <div className="env-vars">
                  {envVars}
                  {pendingEnvVars}
                  <div className="keyval-row">
                    <input id="new-env-key" type="text" className="key line"></input>
                    <input id="new-env-val" type="text" className="val line"></input>
                    <a onClick={this.handleAddPendingEnvVar} className="only-icon btn btn-positive small"><span className="icon icon-add-1"></span></a>
                  </div>
                </div>
                <a className="btn btn-action" onClick={this.handleSaveEnvVar}>Save</a>
              </div>
              <div className="settings-section">
                <h3>Delete Container</h3>
                <a className="btn btn-action" onClick={this.handleDeleteContainer}>Delete Container</a>
              </div>
            </div>
          </div>
        );
      }
    }

    var tabHomeClasses = React.addons.classSet({
      'tab': true,
      'active': this.state.page === this.PAGE_HOME,
      disabled: this.props.container.State.Downloading
    });

    var tabLogsClasses = React.addons.classSet({
      'tab': true,
      'active': this.state.page === this.PAGE_LOGS,
      disabled: this.props.container.State.Downloading
    });

    /*var tabPortsClasses = React.addons.classSet({
      'tab': true,
      'active': this.state.page === this.PAGE_PORTS,
      disabled: this.props.container.State.Downloading
    });

    var tabVolumesClasses = React.addons.classSet({
      'tab': true,
      'active': this.state.page === this.PAGE_VOLUMES,
      disabled: this.props.container.State.Downloading
    });*/

    var tabSettingsClasses = React.addons.classSet({
      'tab': true,
      'active': this.state.page === this.PAGE_SETTINGS,
      disabled: this.props.container.State.Downloading
    });

    return (
      <div className="details">
        <ContainerDetailsHeader container={this.props.container} />
        <div className="details-subheader">
          <div className="details-header-actions">
            <div className="action">
              <span className="icon icon-play-2 action-icon run-icon" onClick={this.handleView}></span>
              <span className="btn-label">Run</span>
            </div>
            <div className="action">
              <span className="icon icon-refresh action-icon" onClick={this.handleRestart}></span>
              <span className="btn-label">Restart</span>
            </div>
            <div className="action">
              <span className="icon icon-window-code-3 action-icon" onClick={this.handleTerminal}></span>
              <span className="btn-label">Terminal</span>
            </div>
          </div>
          <div className="details-subheader-tabs">
            <span className={tabHomeClasses} onClick={this.showHome}>Home</span>
            <span className={tabLogsClasses} onClick={this.showLogs}>Logs</span>
            <span className={tabSettingsClasses} onClick={this.showSettings}>Settings</span>
          </div>
        </div>
        {body}
      </div>
    );
  }
});

module.exports = ContainerDetails;
