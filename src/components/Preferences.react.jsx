import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import Router from 'react-router';
import util from '../utils/Util';
import electron from 'electron';
const remote = electron.remote;

var Preferences = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      closeVMOnQuit: localStorage.getItem('settings.closeVMOnQuit') === 'true',
      useVM: localStorage.getItem('settings.useVM') === 'true',
      metricsEnabled: metrics.enabled(),
      terminalShell: localStorage.getItem('settings.terminalShell') || "sh",
      startLinkedContainers: localStorage.getItem('settings.startLinkedContainers') === 'true'
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
  handleChangeUseVM: function (e) {
    var checked = e.target.checked;
    this.setState({
      useVM: checked
    });
    localStorage.setItem('settings.useVM', checked);
    util.isNative();
    metrics.track('Toggled VM or Native settting', {
      vm: checked
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
  handleChangeTerminalShell: function (e) {
    var value = e.target.value;
    this.setState({
      terminalShell: value
    });
    localStorage.setItem('settings.terminalShell', value);
  },
  handleChangeStartLinkedContainers: function (e) {
    var checked = e.target.checked;
    this.setState({
      startLinkedContainers: checked
    });
    localStorage.setItem('settings.startLinkedContainers', checked ? 'true' : 'false');
  },
  render: function () {
    var vmSettings, vmShutdown, nativeSetting;

    if (process.platform !== 'linux') {
      // We are on a Mac or Windows
      if (util.isNative() || (localStorage.getItem('settings.useVM') === 'true')) {
        nativeSetting = (
            <div className="option">
              <div className="option-name">
                <label htmlFor="useVM">Use VirtualBox instead of Native on next restart</label>
              </div>
              <div className="option-value">
                <input id="useVM" type="checkbox" checked={this.state.useVM} onChange={this.handleChangeUseVM}/>
              </div>
            </div>
        );
      }
      if (!util.isNative()) {
        vmShutdown = (
            <div className="option">
              <div className="option-name">
                <label htmlFor="closeVMOnQuit">Shutdown Linux VM on closing Kitematic</label>
              </div>
              <div className="option-value">
                <input id="closeVMOnQuit" type="checkbox" checked={this.state.closeVMOnQuit} onChange={this.handleChangeCloseVMOnQuit}/>
              </div>
            </div>
        );
      }

      vmSettings = (
          <div>
            <div className="title">VM Settings</div>
            {vmShutdown}
            {nativeSetting}
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
              <label htmlFor="metricsEnabled">Report anonymous usage analytics</label>
            </div>
            <div className="option-value">
              <input id="metricsEnabled" type="checkbox" checked={this.state.metricsEnabled} onChange={this.handleChangeMetricsEnabled}/>
            </div>
          </div>
          <div className="option">
            <div className="option-name">
              <label htmlFor="terminalShell">Exec command shell</label>
            </div>
            <div className="option-value">
              <select id="terminalShell" value={this.state.terminalShell} onChange={this.handleChangeTerminalShell}>
                <option value="sh">sh</option>
                <option value="bash">bash</option>
              </select>
            </div>
          </div>
          <div className="option">
            <div className="option-name">
              <label htmlFor="startLinkedContainers">Start linked containers</label>
            </div>
            <div className="option-value">
              <input id="startLinkedContainers" type="checkbox" checked={this.state.startLinkedContainers} onChange={this.handleChangeStartLinkedContainers}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
