var SetupDigitalOcean = require('../stores/drivers/SetupDigitalOcean');
var React = require('react/addons');
var metrics = require('../utils/MetricsUtil');
var drivers = require('../utils/DriversUtil');
var path = require('path');
var Router = require('react-router');
var SetupVirtualBox = require('../stores/drivers/SetupVirtualBox');
var vboxBoot2DockerURL = "";
var vboxMemory = "";
var docAccessToken = "";
var docRegeion = "";
var docSize = "";
var docImage = "";

var Preferences = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      closeVMOnQuit: localStorage.getItem('settings.closeVMOnQuit') === 'true',
      metricsEnabled: metrics.enabled(),
      driversEnabled: drivers.enabled(),

      vboxEnabled: localStorage.getItem('settings.vboxEnabled') === 'true',
      vboxBoot2DockerURL: localStorage.getItem('settings.virtualbox-boot2docker-url') || path.join(process.env.RESOURCES_PATH, 'boot2docker.iso'),
      vboxCpu: localStorage.getItem('settings.virtualbox-cpu-count') || "1",
      vboxDisk: localStorage.getItem('settings.virtualbox-disk-size') || "20000",
      vboxCidr: localStorage.getItem('settings.virtualbox-hostonly-cidr') || "192.168.99.1/24",
      vboxMemory: localStorage.getItem('settings.virtualbox-memory') || "2048",

      docEnabled: localStorage.getItem('settings.digitalocean-enabled') === 'true',
      docAccessToken: localStorage.getItem('settings.digitalocean-access-token') || "",
      docImage: localStorage.getItem('settings.digitalocean-image') || "",
      docRegion: localStorage.getItem('settings.digitalocean-region') || "",
      docSize: localStorage.getItem('settings.digitalocean-size')  || "512",

      fusionEnabled: localStorage.getItem('settings.fusionEnabled') === 'true',
      fusionBoot2DockerURL: localStorage.getItem('settings.vmwarefusion-boot2docker-url')  || "",
      fusionCpu: localStorage.getItem('settings.vmwarefusion-cpu-count')  || "1",
      fusionMemory: localStorage.getItem('settings.vmwarefusion-memory-size')  || "1024",
      fusionDisk: localStorage.getItem('settings.vmwarefusion-disk-size')  || "",

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
  handleFusionEnabled: function(e) {
    var checked = e.target.checked;
    this.setState({
        fusionEnabled: checked
      });
    localStorage.setItem('settings.fusionEnabled', checked);
    metrics.track('toggled fusion', {
      close: checked
    });
  },
  handleApplyClicked: function(e) {
    console.log("Apply was clicked");

    // virtualbox driver flags
    localStorage.setItem('settings.virtualbox-enabled', this.state.vboxEnabled);
    localStorage.setItem('settings.virtualbox-boot2docker-url', this.state.vboxBoot2DockerURL);
    localStorage.setItem('settings.virtualbox-cpu-count', this.state.vboxCpu);
    localStorage.setItem('settings.virtualbox-disk-size', this.state.vboxDisk);
    localStorage.setItem('settings.virtualbox-hostonly-cidr', this.state.vboxCidr);
    localStorage.setItem('settings.virtualbox-memory', this.state.vboxMemory);

    // digital ocean driver flags
    localStorage.setItem('settings.digitalocean-enabled', this.state.docEnabled);
    localStorage.setItem('settings.digitalocean-access-token', this.state.docAccessToken);
    localStorage.setItem('settings.digitalocean-image', this.state.docImage);
    localStorage.setItem('settings.digitalocean-region', this.state.docRegion);
    localStorage.setItem('settings.digitalocean-size', this.state.docSize);

    // fusion flags
    localStorage.setItem('settings.vmwarefusion', this.state.fusionEnabled);
    localStorage.setItem('settings.vmwarefusion-boot2docker-url', this.state.fusionBoot2DockerURL);
    localStorage.setItem('settings.vmwarefusion-cpu-count', this.state.fusionCpu);
    localStorage.setItem('settings.vmwarefusion-disk-size', this.state.fusionDisk);
    localStorage.setItem('settings.vmwarefusion-memory-size', this.state.fusionMemory);

    // Check for vbox enabling and transition as appropriate
    if (this.state.vboxEnabled) {
      this.transitionTo('setup');
      SetupVirtualBox.setup().then(() => {
        console.log("SetupVirtualBox.setup() called");
        this.transitionTo('search');
      }).catch(err => {
        metrics.track('Setup Failed', {
          step: 'catch',
          message: err.message
        });
        throw err;
      });
    }
    if (this.state.docEnabled) {
      this.transitionTo('setup');
      SetupDigitalOcean.setup().then(() => {
        console.log("SetupDigitalOcean.setup() called");
        this.transitionTo('search');
      }).catch(err => {
        metrics.track('Setup Failed', {
          step: 'catch',
          message: err.message
        });
        throw err;
      });
    }
  },
  // No idea why these events work - DO NOT TOUCH
  handleVirtualBoxBoot2DockerURL: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        vboxBoot2DockerURL: tmpvalue
    });
  },
  handleVboxCpu: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        vboxCpu: tmpvalue
    });
  },
  handleVboxDisk: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        vboxDisk: tmpvalue
    });
  },
  handleVboxCidr: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        vboxCidr: tmpvalue
    });
  },
  handleVboxMemory: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        vboxMemory: tmpvalue
    });
  },
  handleDocAccessToken: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        docAccessToken: tmpvalue
    });
  },
  handleDocRegion: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        docRegion: tmpvalue
    });
  },
  handleDocSize: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        docSize: tmpvalue
    });
  },
  handleDocImage: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        docImage: tmpvalue
    });
  },
  handleFusionBoxBoot2DockerURL: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        fusionBoot2DockerURL: tmpvalue
    });
  },
  handleFusionCpu: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        fusionCpu: tmpvalue
    });
  },
  handleFusionMemory: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        fusionMemory: tmpvalue
    });
  },
  handleFusionDisk: function(e) {
    var tmpvalue = e.target.value;
    this.setState({
        fusionDisk: tmpvalue
    });
  },
  render: function () {
    vboxMemory = this.state.vboxMemory;
    return (
      <div className="preferences">
        <div className="preferences-content">
          <a onClick={this.handleGoBackClick}>Go Back</a>
          <div className="settings-box">
              <div className="title">VM Settings</div>
              <div className="option">
                <div className="option-name">
                  Shut Down Linux VM on closing Kitematic
                </div>
                <div className="option-value">
                  <input type="checkbox" checked={this.state.closeVMOnQuit} onChange={this.handleChangeCloseVMOnQuit}/>
                </div>
              </div>
          </div>
          <div className="settings-box">
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
          <div className="settings-box">
              <div className="title">VirtualBox settings</div>
              <div className="option">
                <div className="option-name">
                   VirtualBox enabled
                </div>
                <div className="option-value">
                  <input type="checkbox" checked={this.state.vboxEnabled} onChange={this.handleVirtualBoxEnabled} />
                </div>
              </div>
              <div className="virtualbox-options">
                  <div className="option">
                    <div className="option-name">
                       virtualbox-boot2docker-url
                    </div>
                    <div className="option-value">
                      <input type="text" value={this.state.vboxBoot2DockerURL} onChange={this.handleVirtualBoxBoot2DockerURL} />
                    </div>
                  </div>
                  <div className="option">
                    <div className="option-name">
                       virtualbox-cpu-count
                    </div>
                    <div className="option-value">
                      <input type="text" value={this.state.vboxCpu} name="vboxCpu" onChange={this.handleVboxCpu} />
                    </div>
                  </div>
                  <div className="option">
                    <div className="option-name">
                       virtualbox-disk-size
                    </div>
                    <div className="option-value">
                      <input type="text" value={this.state.vboxDisk} name="vboxDisk" onChange={this.handleVboxDisk} />
                    </div>
                  </div>
                  <div className="option">
                    <div className="option-name">
                       virtualbox-hostonly-cidr
                    </div>
                    <div className="option-value">
                      <input type="text" value={this.state.vboxCidr} name="vboxCidr" onChange={this.handleVboxCidr} />
                    </div>
                  </div>
                  <div className="option">
                    <div className="option-name">
                       virtualbox-memory
                    </div>
                    <div className="option-value">
                      <input type="text" value={this.state.vboxMemory} name="vboxMemory" onChange={this.handleVboxMemory} />
                    </div>
                  </div>
              </div>
          </div>
          <div className="settings-box">
              <div className="title">DigitalOcean settings</div>
              <div className="option">
                <div className="option-name">
                   DigitalOcean enabled
                </div>
                <div className="option-value">
                  <input type="checkbox" checked={this.state.docEnabled} onChange={this.handleDigitalOceanEnabled}/>
                </div>
              </div>
              <div className="digitalocean-parameters">
                  <div className="option">
                    <div className="option-name">
                       digitalocean-access-token
                    </div>
                    <div className="option-value">
                      <input type="text" value={this.state.docAccessToken} name="docAccessToken" onChange={this.handleDocAccessToken}/>
                    </div>
                  </div>
                  <div className="option">
                    <div className="option-name">
                       digitalocean-region
                    </div>
                    <div className="option-value">
                      <input type="text" value={this.state.docRegion} name="docRegion" onChange={this.handleDocRegion}/>
                    </div>
                  </div>
                  <div className="option">
                    <div className="option-name">
                       digitalocean-size
                    </div>
                    <div className="option-value">
                      <input type="text" value={this.state.docSize} name="docSize" onChange={this.handleDocSize} />
                    </div>
                  </div>
                  <div className="option">
                    <div className="option-name">
                       digitalocean-image
                    </div>
                    <div className="option-value">
                      <input type="text" value={this.state.docImage} name="docImage" onChange={this.handleDocImage}/>
                    </div>
                  </div>
              </div>
          </div>
          <div className="settings-box">
              <div className="title">VMware Fusion settings</div>
              <div className="option">
                <div className="option-name">
                   VMware Fusion enabled
                </div>
                <div className="option-value">
                  <input type="checkbox" checked={this.state.fusionEnabled} onChange={this.handleFusionEnabled}/>
                </div>
              </div>
              <div className="option">
                  <div className="option-name">
                     vmwarefusion-boot2docker-url
                  </div>
                  <div className="option-value">
                    <input type="text" value={this.state.fusionBoot2DockerURL} onChange={this.handleFusionBoxBoot2DockerURL} />
                  </div>
              </div>
              <div className="option">
                  <div className="option-name">
                     vmwarefusion-cpu-count
                  </div>
                  <div className="option-value">
                    <input type="text" value={this.state.fusionCpu} onChange={this.handleFusionCpu} />
                  </div>
              </div>
              <div className="option">
                  <div className="option-name">
                     vmwarefusion-memory-size
                  </div>
                  <div className="option-value">
                    <input type="text" value={this.state.fusionMemory} onChange={this.handleFusionMemory} />
                  </div>
              </div>
              <div className="option">
                  <div className="option-name">
                     vmwarefusion-disk-size
                  </div>
                  <div className="option-value">
                    <input type="text" value={this.state.fusionDisk} onChange={this.handleFusionDisk} />
                  </div>
              </div>
          </div>
        <div className="save-preferences">
          <button type="button" onClick={this.handleApplyClicked}>Apply</button>
        </div>
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
