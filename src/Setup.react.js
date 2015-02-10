var React = require('react/addons');
var Router = require('react-router');
var Radial = require('./Radial.react.js');
var SetupStore = require('./SetupStore');
var RetinaImage = require('react-retina-image');
var Header = require('./Header.react');

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
    var message = "VirtualBox is being downloaded from Oracle's servers. Kitematic requires VirtualBox to run.";
    return (
      <div className="setup">
        <Header />
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
            <h4>Step 1 out of 4</h4>
            <h1>Downloading VirtualBox</h1>
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  },
  renderInstallingVirtualboxStep: function () {
    var message = 'VirtualBox is being installed in the background. We may need you to type in your password to continue.';
    return (
      <div className="setup">
        <Header />
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
            <h4>Step 2 out of 4</h4>
            <h1>Installing VirtualBox</h1>
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  },
  renderInitBoot2DockerStep: function () {
    var message = 'To run Docker containers on your computer, we are setting up a Linux virtual machine provided by boot2docker.';
    return (
      <div className="setup">
        <Header />
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
            <h4>Step 3 out of 4</h4>
            <h1>Setting up Docker VM</h1>
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  },
  renderStartBoot2DockerStep: function () {
    var message = 'Kitematic is starting the boot2docker VM. This may take about a minute.';
    return (
      <div className="setup">
        <Header />
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
            <h4>Step 4 out of 4</h4>
            <h1>Starting Docker VM</h1>
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
          <Header />
          <div className="image">
            <div className="contents">
              <RetinaImage img src="install-error.png"/>
              <div className="detail">
              </div>
            </div>
          </div>
          <div className="desc">
            <div className="content">
              <h4>Installation Error</h4>
              <h1>We&#39;re Sorry!</h1>
              <p>There seem to be an unexpected error with Kitematic:</p>
              <p className="error">{this.state.error}</p>
            </div>
          </div>
        </div>
      );
    } else {
      return step;
    }
  }
});

module.exports = Setup;
