var React = require('react/addons');
var metrics = require('../utils/MetricsUtil');
var Router = require('react-router');

var Preferences = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      closeVMOnQuit: localStorage.getItem('settings.closeVMOnQuit') === 'true',
      debugEnabled: localStorage.getItem('settings.debugEnabled') === 'true',
      metricsEnabled: metrics.enabled()
    };
  },
  handleGoBackClick: function () {
    this.goBack();
    metrics.track('Went Back From Preferences');
  },
  handleChangeCloseVMOnQuit: function (e) {
    var checked = e.target.checked;
    this.setState({
      closeVMOnQuit: checked
    });
    localStorage.setItem('settings.closeVMOnQuit', checked);
    metrics.track('Toggled Close VM On Quit', {
      close: checked
    });
  },
  handleChangeMetricsEnabled: function (e) {
    var checked = e.target.checked;
    this.setState({
      metricsEnabled: checked
    });
    metrics.setEnabled(checked);
    metrics.track('Toggled util/MetricsUtil', {
      enabled: checked
    });
  },
  handleChangeDebugEnabled: function (e) {
    var checked = e.target.checked;
    this.setState({
      debugEnabled: checked
    });
    localStorage.setItem('settings.debugEnabled', checked);
    metrics.track('Toggled Enable "Debug" tab', {
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
              Shut Down Linux VM on closing Kitematic
            </div>
            <div className="option-value">
              <input type="checkbox" checked={this.state.closeVMOnQuit} onChange={this.handleChangeCloseVMOnQuit}/>
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
          <div className="title">Developer tools</div>
          <div className="option">
            <div className="option-name">
              Enable "Debug" tab
            </div>
            <div className="option-value">
              <input type="checkbox" checked={this.state.debugEnabled} onChange={this.handleChangeDebugEnabled}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
