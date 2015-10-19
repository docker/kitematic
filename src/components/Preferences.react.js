import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import Router from 'react-router';
import regHubUtil from '../utils/RegHubUtil';

var domainRegex = /([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:\/|$)/;

var Preferences = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      closeVMOnQuit: localStorage.getItem('settings.closeVMOnQuit') === 'true',
      metricsEnabled: metrics.enabled(),
      registryHub: localStorage.getItem('settings.registryHub') || 'https://hub.docker.com/v2',
      registryHubError: null
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
  handleChangeRegistryHub: function (e) {
    var registryHub = e.target.value;
    if (!domainRegex.test(registryHub)) {
      this.setState({
        registryHubError: 'Domain must be valid'
      });
    } else {
      this.setState({
        registryHub: registryHub,
        registryHubError: null
      });
    }
  },
  handleSaveRegistryHub: function () {
    let registryHub = this.state.registryHub;
    if (registryHub.substr(-1) === '/') {
      registryHub = registryHub.substr(0, registryHub.length - 1);
    }
    // Verify registry
    regHubUtil.check(registryHub).then(resp => {
      localStorage.setItem('settings.registryHub', registryHub);
      metrics.track('Updated registry hub link', {
        registryHub: registryHub,
        response: resp
      });
      // Add verified/clean url
      this.setState({
        registryHub: registryHub,
        registryHubError: null
      });
      this.transitionTo('search');
    }).catch(e => {
      this.setState({
        registryHubError: e.message
      });
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
  render: function () {
    return (
      <div className="preferences">
        <div className="preferences-content">
          <a onClick={this.handleGoBackClick}>Go Back</a>
          <div className="title">VM Settings</div>
          <div className="option">
            <div className="option-name">
              Shutdown Linux VM on closing Kitematic
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
          <div className="option">
            <div className="option-name">
              Docker Registry URL
            </div>
            <div className="option-value">
              <input type="text" defaultValue={this.state.registryHub} placeholder='https://hub.docker.com/v2' className="line" onChange={this.handleChangeRegistryHub}/>
            </div>
          </div>
          <div className="option">
            <div className="option-name">
              <span className="text-danger">{this.state.registryHubError}</span>
            </div>
            <div className="option-value">
              <a className="btn btn-action" onClick={this.handleSaveRegistryHub}>Save Registry</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
