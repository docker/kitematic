import _ from 'underscore';
import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import ContainerUtil from '../utils/ContainerUtil';
import containerActions from '../actions/ContainerActions';

var ContainerSettingsAdvanced = React.createClass({
  mixins: [React.addons.LinkedStateMixin],

  contextTypes: {
    router: React.PropTypes.func
  },

  getInitialState: function () {
    let [tty, openStdin, privileged] = ContainerUtil.mode(this.props.container) || [true, true, false];
    return {
      tty: tty,
      openStdin: openStdin,
      privileged: privileged
    };
  },

  handleSaveAdvancedOptions: function () {
    metrics.track('Saved Advanced Options');
    let tty = this.state.tty;
    let openStdin = this.state.openStdin;
    let privileged = this.state.privileged;
    let hostConfig = _.extend(this.props.container.HostConfig, {Privileged: privileged});
    containerActions.update(this.props.container.Name, {Tty: tty, OpenStdin: openStdin, HostConfig: hostConfig});
  },

  handleChangeTty: function () {
    this.setState({
      tty: !this.state.tty
    });
  },

  handleChangeOpenStdin: function () {
    this.setState({
      openStdin: !this.state.openStdin
    });
  },

  handleChangePrivileged: function () {
    this.setState({
      privileged: !this.state.privileged
    });
  },

  render: function () {
    if (!this.props.container) {
      return false;
    }

    return (
      <div className="settings-panel">
        <div className="settings-section">
          <h3>Advanced Options</h3>
          <div className="checkboxes">
            <p><label><input type="checkbox" checked={this.state.tty} onChange={this.handleChangeTty}/>Allocate a TTY for this container</label></p>
            <p><label><input type="checkbox" checked={this.state.openStdin} onChange={this.handleChangeOpenStdin}/>Keep STDIN open even if not attached</label></p>
            <p><label><input type="checkbox" checked={this.state.privileged} onChange={this.handleChangePrivileged}/>Privileged mode</label></p>
          </div>
          <a className="btn btn-action" disabled={this.props.container.State.Updating} onClick={this.handleSaveAdvancedOptions}>Save</a>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsAdvanced;
