var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var path =  require('path');
var remote = require('remote');
var rimraf = require('rimraf');
var fs = require('fs');
var metrics = require('./Metrics');
var dialog = remote.require('dialog');
var ContainerStore = require('./ContainerStore');
var ContainerUtil = require('./ContainerUtil');

var containerNameSlugify = function (text) {
  text = text.replace(/^\s+|\s+$/g, ''); // Trim
  text = text.toLowerCase();
  // Remove Accents
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/,:;";
  var to   = "aaaaeeeeiiiioooouuuunc-----";
  for (var i=0, l=from.length ; i<l ; i++) {
    text = text.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }
  text = text.replace(/[^a-z0-9-_.]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-') // Collapse whitespace and replace by -
    .replace(/-+/g, '-')  // Collapse dashes
    .replace(/_+/g, '_'); // Collapse underscores
  return text;
};

var ContainerSettingsGeneral = React.createClass({
  mixins: [Router.State, Router.Navigation],
  getInitialState: function () {
    return {
      slugName: null,
      nameError: null,
      env: {},
      pendingEnv: {}
    };
  },
  componentWillReceiveProps: function () {
    this.init();
  },
  componentDidMount: function() {
    this.init();
  },
  init: function () {
    var container = ContainerStore.container(this.getParams().name);
    if (!container) {
      return;
    }
    this.setState({
      env: ContainerUtil.env(container),
      nameError: null
    });
  },
  handleNameChange: function (e) {
    var newName = e.target.value;
    if (newName === this.state.slugName) {
      return;
    }
    if (!newName.length) {
      this.setState({
        slugName: null
      });
    } else {
      this.setState({
        slugName: containerNameSlugify(newName),
        nameError: null
      });
    }
  },
  handleNameOnKeyUp: function (e) {
    if (e.keyCode === 13 && this.state.slugName) {
      this.handleSaveContainerName();
    }
  },
  handleSaveContainerName: function () {
    var newName = this.state.slugName;
    if (newName === this.props.container.Name) {
      return;
    }

    this.setState({
      slugName: null
    });
    var oldName = this.props.container.Name;
    if (ContainerStore.container(newName)) {
      this.setState({
        nameError: 'A container already exists with this name.'
      });
      return;
    }
    ContainerStore.rename(oldName, newName, err => {
      if (err) {
        this.setState({
          nameError: err.message
        });
        return;
      }
      metrics.track('Changed Container Name');
      this.transitionTo('containerSettingsGeneral', {name: newName});
      var oldPath = path.join(process.env.HOME, 'Kitematic', oldName);
      var newPath = path.join(process.env.HOME, 'Kitematic', newName);
      rimraf(newPath, () => {
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }
        var binds = _.pairs(this.props.container.Volumes).map(function (pair) {
          return pair[1] + ':' + pair[0];
        });
        var newBinds = binds.map(b => {
          return b.replace(path.join(process.env.HOME, 'Kitematic', oldName), path.join(process.env.HOME, 'Kitematic', newName));
        });
        ContainerStore.updateContainer(newName, {Binds: newBinds}, err => {
          rimraf(oldPath, () => {});
          if (err) {
            console.log(err);
          }
        });
      });
    });
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
    metrics.track('Saved Environment Variables');
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
    metrics.track('Added Pending Environment Variable');
  },
  handleRemoveEnvVar: function (key) {
    var newEnv = _.omit(this.state.env, key);
    this.setState({
      env: newEnv
    });
    metrics.track('Removed Environment Variable');
  },
  handleRemovePendingEnvVar: function (key) {
    var newEnv = _.omit(this.state.pendingEnv, key);
    this.setState({
      pendingEnv: newEnv
    });
    metrics.track('Removed Pending Environment Variable');
  },
  handleDeleteContainer: function () {
    dialog.showMessageBox({
      message: 'Are you sure you want to delete this container?',
      buttons: ['Delete', 'Cancel']
    }, function (index) {
      var volumePath = path.join(process.env.HOME, 'Kitematic', this.props.container.Name);
      if (fs.existsSync(volumePath)) {
        rimraf(volumePath, function (err) {
          console.log(err);
        });
      }
      if (index === 0) {
        metrics.track('Deleted Container', {
          from: 'settings',
          type: 'existing'
        });
        ContainerStore.remove(this.props.container.Name, function (err) {
          console.error(err);
        });
      }
    }.bind(this));
  },
  render: function () {
    if (!this.props.container) {
      return (<div></div>);
    }
    var willBeRenamedAs;
    var btnSaveName = (
      <a className="btn btn-action" onClick={this.handleSaveContainerName} disabled="disabled">Save</a>
    );
    if (this.state.slugName) {
      willBeRenamedAs = (
        <p>Will be renamed as: <strong>{this.state.slugName}</strong></p>
      );
      btnSaveName = (
        <a className="btn btn-action" onClick={this.handleSaveContainerName}>Save</a>
      );
    } else if (this.state.nameError) {
      willBeRenamedAs = (
        <p><strong>{this.state.nameError}</strong></p>
      );
    }
    var rename = (
      <div className="settings-section">
        <h3>Container Name</h3>
        <div className="container-name">
          <input id="input-container-name" type="text" className="line" placeholder="Container Name" defaultValue={this.props.container.Name} onChange={this.handleNameChange} onKeyUp={this.handleNameOnKeyUp}></input>
          {willBeRenamedAs}
        </div>
        {btnSaveName}
      </div>
    );
    var self = this;
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
    return (
      <div className="settings-panel">
        {rename}
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
    );
  }
});

module.exports = ContainerSettingsGeneral;
