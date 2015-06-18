var React = require('react/addons');
var metrics = require('../utils/MetricsUtil');
var ContainerUtil = require('../utils/ContainerUtil');
var containerActions = require('../actions/ContainerActions');

var ContainerSettingsAdvanced = React.createClass({
  mixins: [React.addons.LinkedStateMixin],

  contextTypes: {
    router: React.PropTypes.func
  },

  getInitialState: function () {
    let [tty, openStdin] = ContainerUtil.mode(this.props.container) || [true, true];
    return {
      tty: tty,
      openStdin: openStdin
    };
  },

  handleSaveAdvancedOptions: function () {
    metrics.track('Saved Advanced Options');
    let tty = this.state.tty;
    let openStdin = this.state.openStdin;
    containerActions.update(this.props.container.Name, {Tty: tty, OpenStdin: openStdin});
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

  render: function () {
    if (!this.props.container) {
      return false;
    }

    return (
      <div className="settings-panel">
        <div className="settings-section">
          <h3>Advanced Options</h3>
          <div className="checkboxes">
            <p><input type="checkbox" checked={this.state.tty} onChange={this.handleChangeTty}/>Allocate a TTY for this container</p>
            <p><input type="checkbox" checked={this.state.openStdin} onChange={this.handleChangeOpenStdin}/>Keep STDIN open even if not attached</p>
          </div>
          <a className="btn btn-action" disabled={this.props.container.State.Updating} onClick={this.handleSaveAdvancedOptions}>Save</a>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsAdvanced;
