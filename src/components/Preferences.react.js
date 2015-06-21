var React = require('react/addons');
var metrics = require('../utils/MetricsUtil');
var drivers = require('../utils/DriversUtil')
var Router = require('react-router');
var vboxBoot2DockerURL = "";
var vboxMemory = "";

var Preferences = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      closeVMOnQuit: localStorage.getItem('settings.closeVMOnQuit') === 'true',
      metricsEnabled: metrics.enabled(),
      driversEnabled: drivers.enabled(),
      vboxEnabled: localStorage.getItem('settings.vboxEnabled') === 'true',
      docEnabled: localStorage.getItem('settings.docEnabled') === 'true',
      vboxBoot2DockerURL: localStorage.getItem('settings.vboxBoot2DockerURL'),
      vboxMemory: localStorage.getItem('settings.vboxMemory'),
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
  handleVirtualBoxEnabled: function(e) {
    var checked = e.target.checked;
    this.setState({
      vboxEnabled: checked
    });
    localStorage.setItem('settings.vboxEnabled', checked);
    metrics.track('toggled vbox', {
      close: checked
    });
  },
  handleDigitalOceanEnabled: function(e) {
    var checked = e.target.checked;
    this.setState({
        docEnabled: checked
      });
    localStorage.setItem('settings.docEnabled', checked);
    metrics.track('toggled doc', {
      close: checked
    });
  },
  handleApplyClicked: function(e) {
    console.log("Apply was clicked");
    console.log("mem = " + this.state.vboxMemory)
    localStorage.setItem('settings.vboxBoot2DockerURL', this.state.vboxBoot2DockerURL || "");
    localStorage.setItem('settings.vboxMemory', this.state.vboxMemory || "0");
    //var SetupVirtualBox = require('./stores/drivers/SetupVirtualBox');
  },
  // No idea why these events work - DO NOT TOUCH
  handleVirtualBoxBoot2DockerURL: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        vboxBoot2DockerURL: tmpvalue
    });
  },
  handleVirtualBoxMemory: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        vboxMemory: tmpvalue
    });
  },
  render: function () {
    vboxMemory = this.state.vboxMemory;
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
          <tr />
          <div className="title">Machine settings</div>
          <div className="option">
            <div className="option-name">
               VirtualBox enabled
            </div>
            <div className="option-value">
              <input type="checkbox" checked={this.state.vboxEnabled} onChange={this.handleVirtualBoxEnabled}/>
            </div>
          </div>
          <div class="virtualbox-options">
              <div className="option">
                <div className="option-name">
                   virtualbox-boot2docker-url
                </div>
                <div className="option-value">
                  <input type="text" value={this.state.vboxBoot2DockerURL} name="vboxBoot2DockerURL" onChange={this.handleVirtualBoxBoot2DockerURL}/>
                </div>
              </div>
              <div className="option">
                <div className="option-name">
                   virtualbox-memory
                </div>
                <div className="option-value">
                  <input type="text" value={this.state.vboxMemory} name="vboxMemory" onChange={this.handleVirtualBoxMemory}/>
                </div>
              </div>
          </div>
          <div className="option">
            <div className="option-name">
               DigitalOcean enabled
            </div>
            <div className="option-value">
              <input type="checkbox" checked={this.state.docEnabled} onChange={this.handleDigitalOceanEnabled}/>
            </div>
          </div>
          <div className="option">
            <div className="option-name">
               DigitalOcean parameters
            </div>
            <div className="option-value">
              <input type="text" onChange={this.handleDigitalOceanConfiguration}/>
            </div>
          </div>

          <div>
            <button type="button" onClick={this.handleApplyClicked}>Apply</button>
        </div>
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
