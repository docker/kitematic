var _ = require('underscore');
var React = require('react/addons');
var remote = require('remote');
var metrics = require('../utils/MetricsUtil');
var dialog = remote.require('dialog');
var ContainerUtil = require('../utils/ContainerUtil');
var containerActions = require('../actions/ContainerActions');
var containerStore = require('../stores/ContainerStore');
var util = require('../utils/Util');

var _runtimeDescriptions = {
  "CpuShares": "CPU shares (relative weight vs other containers)",
  "Memory": "Memory limit (unit is MB and should be greater than 4MB)",
  "MemorySwap": "Total memory limit (memory + swap - unit is MB), always make the value larger than memory."
};

var ContainerSettingsAdvance = React.createClass({
  mixins: [React.addons.LinkedStateMixin],

  contextTypes: {
    router: React.PropTypes.func
  },

  getInitialState: function () {
    let runtime = ContainerUtil.runtime(this.props.container) || [];
    runtime = _.map(runtime, l => {
      return [util.randomId(), l[0], l[1]];
    });

    return {
      runtime: runtime
    };
  },

  handleSaveAdvVars: function () {
    metrics.track('Saved Runtime settings');
    let runtime = {};
    _.each(this.state.runtime, kvp => {
      let [, key, value] = kvp;
      if ((key && key.length) || (value && value.length)) {
        if (!isNaN(parseInt(value)) || isFinite(value) || parseInt(value) !== 0) {
          if(key == "Memory" || key == "MemorySwap"){
            runtime[key] = parseInt(value+"000000");
          } else {
            runtime[key] = parseInt(value);
          }
        }

      }
    });
    let runtimeHConfig = _.extend(this.props.container.HostConfig, runtime);
    containerActions.update(this.props.container.Name, {HostConfig: runtimeHConfig});
    // Save for future runtime
    localStorage.setItem('settings.runtime.' + this.props.container.Name, JSON.stringify(runtime));
  },

  handleChangeAdvVal: function (index, event) {
    let runtime = _.map(this.state.runtime, _.clone);
    runtime[index][2] = event.target.value;
    this.setState({
      runtime: runtime
    });
  },

  render: function () {
    if (!this.props.container) {
      return false;
    }

    let vars = _.map(this.state.runtime, (kvp, index) => {
      let [id, key, val] = kvp;
      var keyDescription = _runtimeDescriptions[key];
      return (
        <div key={id} className="keyval-row">
          <input type="text" className="key line" defaultValue={key} readOnly />
          <input type="text" className="val line" defaultValue={val} onChange={this.handleChangeAdvVal.bind(this, index)} />
          <p>{keyDescription}</p>
        </div>
      );
    });

    return (
      <div className="settings-panel">
        <div className="settings-section">
          <h3>Configure Runtime Settings</h3>
          <div className="adv-vars-labels">
            <div className="label-key">RUNTIME</div>
            <div className="label-val">CONSTRAINT</div>
          </div>
          <div className="adv-vars">
            {vars}
            <p>Empty or 0 value will be ignored </p>
          </div>
          <a className="btn btn-action" disabled={this.props.container.State.Updating} onClick={this.handleSaveAdvVars}>Save</a>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsAdvance;
