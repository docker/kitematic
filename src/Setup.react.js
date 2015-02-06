var React = require('react/addons');
var Router = require('react-router');
var Radial = require('./Radial.react.js');
var SetupStore = require('./SetupStore');
var RetinaImage = require('react-retina-image');

var Setup = React.createClass({
  mixins: [ Router.Navigation ],
  getInitialState: function () {
    return {
      progress: 0,
      name: ''
    };
  },
  componentWillMount: function () {
    SetupStore.on(SetupStore.PROGRESS_EVENT, this.update);
    SetupStore.on(SetupStore.STEP_EVENT, this.update);
    SetupStore.on(SetupStore.ERROR_EVENT, this.update);
  },
  componentDidMount: function () {
    this.update();
  },
  update: function () {
    this.setState({
      progress: SetupStore.percent(),
      step: SetupStore.step(),
      error: SetupStore.error()
    });
  },
  renderDownloadingVirtualboxStep: function () {
    var message = 'Kitematic needs VirtualBox to run containers. VirtualBox is being downloaded from Oracle\'s website.';
    return (
      <div className="setup">
        <div className="image">
          <div className="contents">
            <RetinaImage img src="virtualbox.png"/>
            <div className="detail">
              <Radial progress={this.state.progress}/>
            </div>
          </div>
        </div>
        <div className="desc">
          <div className="content">
            <h1>Downloading VirtualBox</h1>
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  },
  renderInstallingVirtualboxStep: function () {
    var message = 'VirtualBox is being installed. Administrative privileges are required.';
    return (
      <div className="setup">
        <div className="image">
          <div className="contents">
            <RetinaImage img src="virtualbox.png"/>
            <div className="detail">
              <Radial progress="90" spin="true"/>
            </div>
          </div>
        </div>
        <div className="desc">
          <div className="content">
            <h1>Installing VirtualBox</h1>
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  },
  renderInitBoot2DockerStep: function () {
    var message = 'Containers run in a virtual machine provided by Boot2Docker. Kitematic is setting up that Linux VM.';
    return (
      <div className="setup">
        <div className="image">
          <div className="contents">
            <RetinaImage img src="boot2docker.png"/>
            <div className="detail">
              <Radial progress="90" spin="true"/>
            </div>
          </div>
        </div>
        <div className="desc">
          <div className="content">
            <h1>Setting up the Docker VM</h1>
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  },
  renderStartBoot2DockerStep: function () {
    var message = 'Kitematic is starting the Boot2Docker Linux VM.';
    return (
      <div className="setup">
        <div className="image">
          <div className="contents">
            <RetinaImage img src="boot2docker.png"/>
            <div className="detail">
              <Radial progress="90" spin="true"/>
            </div>
          </div>
        </div>
        <div className="desc">
          <div className="content">
            <h1>Starting the Docker VM</h1>
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  },
  renderStep: function () {
    switch(this.state.step) {
      case 'download_virtualbox':
        return this.renderDownloadingVirtualboxStep();
      case 'install_virtualbox':
        return this.renderInstallingVirtualboxStep();
      case 'cleanup_kitematic':
        return this.renderInitBoot2DockerStep();
      case 'init_boot2docker':
        return this.renderInitBoot2DockerStep();
      case 'start_boot2docker':
        return this.renderStartBoot2DockerStep();
      default:
        return false;
    }
  },
  render: function () {
    var step = this.renderStep();
    if (this.state.error) {
      return (
        <div className="setup">
          <Radial error={true} spin="true" progress="100"/>;
          <p className="error">Error: {this.state.error}</p>
        </div>
      );
    } else {
      return step;
    }
  }
});

module.exports = Setup;
