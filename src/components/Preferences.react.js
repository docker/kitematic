var React = require('react/addons');
var metrics = require('../utils/MetricsUtil');
var drivers = require('../utils/DriversUtil')
var Router = require('react-router');
var SetupVirtualBox = require('../stores/drivers/SetupVirtualBox');

var Preferences = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      closeVMOnQuit: localStorage.getItem('settings.closeVMOnQuit') === 'true',
      metricsEnabled: metrics.enabled(),
      driversEnabled: drivers.enabled(),
      vboxEnabled: localStorage.getItem('settings.vboxEnabled') === 'true',
      docEnabled: localStorage.getItem('settings.docEnabled') === 'true',
      // TODO @fsoppelsa to load drivers configurations
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
  handleVirtualBoxConfiguration: function(e) {
    // TODO @fsoppelsa save in persistent conf
  },
  handleApplyClicked: function(e) {
    console.log("Apply was clicked");
    SetupVirtualBox.setup().then(() => {
      //Menu.setApplicationMenu(Menu.buildFromTemplate(template()));
      //docker.init();
      //if (!hub.prompted() && !hub.loggedin()) {
      //  router.transitionTo('login');
      //} else {
      //  router.transitionTo('search');
      //}
    }).catch(err => {
      metrics.track('Setup Failed', {
        step: 'catch',
        message: err.message
      });
      throw err;
    });
  },
  handleDigitalOceanConfiguration: function(e) {
    // TODO @fsoppelsa save in persistent conf
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
          <div className="option">
            <div className="option-name">
               VirtualBox parameters
            </div>
            <div className="option-value">
              <input type="text" onChange={this.handleVirtualBoxConfiguration}/>
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
