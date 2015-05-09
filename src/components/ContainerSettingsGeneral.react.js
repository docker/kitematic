var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var remote = require('remote');
var metrics = require('../utils/MetricsUtil');
var dialog = remote.require('dialog');
var ContainerUtil = require('../utils/ContainerUtil');
var containerActions = require('../actions/ContainerActions');

var ContainerSettingsGeneral = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  getInitialState: function () {
    return {
      slugName: null,
      nameError: null,
      pendingEnv: ContainerUtil.env(this.props.container) || {}
    };
  },

  willReceiveProps: function () {
    this.setState({
      pendingEnv: ContainerUtil.env(this.props.container) || {}
    });
  },

  handleNameChange: function (e) {
    let name = e.target.value;
    if (name === this.state.slugName) {
      return;
    }

    name = name.replace(/^\s+|\s+$/g, ''); // Trim
    name = name.toLowerCase();
    // Remove Accents
    let from = "àáäâèéëêìíïîòóöôùúüûñç·/,:;";
    let to   = "aaaaeeeeiiiioooouuuunc-----";
    for (var i=0, l=from.length ; i<l ; i++) {
      name = name.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }
    name = name.replace(/[^a-z0-9-_.\s]/g, '') // Remove invalid chars
      .replace(/\s+/g, '-') // Collapse whitespace and replace by -
      .replace(/-+/g, '-')  // Collapse dashes
      .replace(/_+/g, '_'); // Collapse underscores

    this.setState({
      slugName: name
    });
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

    if (this.props.containers[newName]) {
      this.setState({
        nameError: 'A container already exists with this name.'
      });
      return;
    }

    containerActions.rename(this.props.container.Name, newName);
    this.context.router.transitionTo('containerSettingsGeneral', {name: newName});
    metrics.track('Changed Container Name');
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
    metrics.track('Saved Environment Variables');
    containerActions.update(this.props.container.Name, {Env: envVarList});
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

  handleRemovePendingEnvVar: function (key) {
    var newEnv = _.omit(this.state.env, key);
    this.setState({
      env: newEnv
    });
    metrics.track('Removed Environment Variable');
  },

  handleDeleteContainer: function () {
    dialog.showMessageBox({
      message: 'Are you sure you want to delete this container?',
      buttons: ['Delete', 'Cancel']
    }, index => {
      if (index === 0) {
        metrics.track('Deleted Container', {
          from: 'settings',
          type: 'existing'
        });
        containerActions.destroy(this.props.container.Name);
      }
    });
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
    var pendingEnvVars = _.map(this.state.pendingEnv, (val, key) => {
      return (
        <div key={key} className="keyval-row">
          <input type="text" className="key line" defaultValue={key}></input>
          <input type="text" className="val line" defaultValue={val}></input>
          <a onClick={this.handleRemovePendingEnvVar.bind(this, key)} className="only-icon btn btn-action small"><span className="icon icon-cross"></span></a>
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
