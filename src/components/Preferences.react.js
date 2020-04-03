import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import Router from 'react-router';
import util from '../utils/Util';
import electron from 'electron';
const remote = electron.remote;
var FontSelect = React.createClass({
  
  getFontSizes: function(start, end){
    let options = [];
    for(let i = start; i<=end; i++){
      options.push(<option key={i} value={i}>{i+' px'}</option>);
    }
    return options;
  },

  render: function(){
    return (
      <select id={this.props.id} value={this.props.fontSize} onChange={this.props.onChange}>
        {this.getFontSizes(10, 30)}
      </select>
    );
  }
});
var Preferences = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      closeVMOnQuit: localStorage.getItem('settings.closeVMOnQuit') === 'true',
      useVM: localStorage.getItem('settings.useVM') === 'true',
      metricsEnabled: metrics.enabled(),
      terminalShell: localStorage.getItem('settings.terminalShell') || "sh",
      terminalPath: localStorage.getItem('settings.terminalPath') || "/usr/bin/xterm",
      startLinkedContainers: localStorage.getItem('settings.startLinkedContainers') === 'true',
      logsFontSize: localStorage.getItem('settings.logsFontSize') || 10
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
  handleChangeTerminalPath: function (e) {
    var value = e.target.value;
    this.setState({
      terminalPath: value
    });
    localStorage.setItem('settings.terminalPath', value);
  },
  handleChangeStartLinkedContainers: function (e) {
    var checked = e.target.checked;
    this.setState({
      startLinkedContainers: checked
    });
    localStorage.setItem('settings.startLinkedContainers', checked ? 'true' : 'false');
  },
  handleChangeLogsFontSize: function (e) {
    var fontSize = event.target.value;
    this.setState({
      logsFontSize: fontSize
    });
    localStorage.setItem('settings.logsFontSize', fontSize);
  },
  getFontSizes: function(start, end){
    let options = [];
    for(let i = start; i<=end; i++){
      options.push(<option key={i} value={i}>{i+' px'}</option>);
    }
    return options;
  },
  render: function () {
    var vmSettings, vmShutdown, nativeSetting, linuxSettings;

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

    if (process.platform === "linux") {
      linuxSettings = (
        <div>
          <div className="option">
            <div className="option-name">
              <label htmlFor="terminalPath">Terminal path</label>
            </div>
            <div className="option-value">
              <input id="terminalPath" type="text" value={this.state.terminalPath} onChange={this.handleChangeTerminalPath}/>
            </div>
          </div>
        </div>
      )
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
          <div className="option">
            <div className="option-name">
              <label htmlFor="logsFontSize">Container logs font size</label>
            </div>
            <div className="option-value">
              <FontSelect id="logsFontSize" fontSize={this.state.logsFontSize} onChange={this.handleChangeLogsFontSize} />
            </div>
          </div>
          {linuxSettings}
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
