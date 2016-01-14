import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import regHub from '../utils/RegHubUtil';
import Router from 'react-router';

var Preferences = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      closeVMOnQuit: localStorage.getItem('settings.closeVMOnQuit') === 'true',
      metricsEnabled: metrics.enabled(),
      registryUrl: regHub.registryUrl()
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
  handleChangeRegistryUrl: function (e) {
    var value = e.target.value;
    this.setState({
      registryUrl: value
    });
    regHub.setRegistryUrl(value);
  },
  render: function () {
    var vmSettings;

    if (process.platform !== 'linux') {
      vmSettings = (
        <div>
          <div className="title">VM Settings</div>
          <div className="option">
            <div className="option-name">
              Shutdown Linux VM on closing Kitematic
            </div>
            <div className="option-value">
              <input type="checkbox" checked={this.state.closeVMOnQuit} onChange={this.handleChangeCloseVMOnQuit}/>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="preferences">
        <div className="preferences-content">
          <a onClick={this.handleGoBackClick}>Go Back</a>
          {vmSettings}
          <div className="title">App Settings</div>
          <div className="option">
            <div className="option-name">
              Report anonymous usage analytics
            </div>
            <div className="option-value">
              <input type="checkbox" checked={this.state.metricsEnabled} onChange={this.handleChangeMetricsEnabled}/>
            </div>
          </div>
          <div className="option">
            <div className="option-name">
              Set the Registry url
            </div>
            <div className="option-value">
              <input type="text" value={this.state.registryUrl} onChange={this.handleChangeRegistryUrl}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
