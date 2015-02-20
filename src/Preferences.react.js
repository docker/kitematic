var React = require('react/addons');
var ipc = require('ipc');
var metrics = require('./Metrics');
var Router = require('react-router');

if (localStorage.getItem('settings.saveVMOnQuit') === 'true') {
  ipc.send('vm', true);
} else {
  ipc.send('vm', false);
}

var Preferences = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      saveVMOnQuit: localStorage.getItem('settings.saveVMOnQuit') === 'true',
      metricsEnabled: metrics.enabled()
    };
  },
  handleGoBackClick: function () {
    this.goBack();
    metrics.track('Went Back From Preferences');
  },
  handleChangeSaveVMOnQuit: function (e) {
    var checked = e.target.checked;
    this.setState({
      saveVMOnQuit: checked
    });
    ipc.send('vm', checked);
    metrics.track('Toggled Save VM On Quit', {
      save: checked
    });
  },
  handleChangeMetricsEnabled: function (e) {
    var checked = e.target.checked;
    this.setState({
      metricsEnabled: checked
    });
    metrics.setEnabled(checked);
    metrics.track('Toggled Metrics', {
      enabled: checked
    });
  },
  render: function () {
    return (
      <div className="preferences">
        <div className="preferences-content">
          <a onClick={this.handleGoBackClick}>Go Back</a>
          <div className="title">VM Settings</div>
          <div className="option">
            <div className="option-name">
              Save Linux VM state on closing Kitematic
            </div>
            <div className="option-value">
              <input type="checkbox" checked={this.state.saveVMOnQuit} onChange={this.handleChangeSaveVMOnQuit}/>
            </div>
          </div>
          <div className="title">App Settings</div>
          <div className="option">
            <div className="option-name">
              Report anonymous usage analytics
            </div>
            <div className="option-value">
              <input type="checkbox" checked={this.state.metricsEnabled} onChange={this.handleChangeMetricsEnabled}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
