import React from 'react/addons';
import Router from 'react-router';
import Radial from './Radial.react.js';
import RetinaImage from 'react-retina-image';
import Header from './Header.react';
import util from '../utils/Util';
import metrics from '../utils/MetricsUtil';
import setupStore from '../stores/SetupStore';
import setupActions from '../actions/SetupActions';
import shell from 'shell';


var Setup = React.createClass({
  mixins: [Router.Navigation],

  getInitialState: function () {
    return setupStore.getState();
  },

  componentDidMount: function () {
    setupStore.listen(this.update);
  },

  componentWillUnmount: function () {
    setupStore.unlisten(this.update);
  },

  update: function () {
    this.setState(setupStore.getState());
  },

  handleErrorRetry: function () {
    setupActions.retry(false);
  },

  handleUseVbox: function () {
    setupActions.useVbox();
  },

  handleErrorRemoveRetry: function () {
    console.log('Deleting VM and trying again.' );
    setupActions.retry(true);
  },

  handleToolBox: function () {
    metrics.track('Getting toolbox', {
      from: 'setup'
    });
    shell.openExternal('https://www.docker.com/docker-toolbox');
  },

  handleHypervAdminError: function () {
    metrics.track('Goto Hyper-V help', {
      from: 'setup'
    });
    //TODO: send user to the right FAQ place!
    shell.openExternal('https://github.com/docker/kitematic/issues/1463#issuecomment-196257126');
  },

  handleLinuxDockerInstall: function () {
    metrics.track('Opening Linux Docker installation instructions', {
      from: 'setup'
    });
    shell.openExternal('http://docs.docker.com/linux/started/');
  },

  renderContents: function () {
    return (
      <div className="contents">
        <RetinaImage src="boot2docker.png" checkIfRetinaImgExists={false}/>
        <div className="detail">
          <Radial progress={Math.round(this.state.progress)} thick={true} gray={true}/>
        </div>
      </div>
    );
  },

  renderProgress: function () {
    let title = 'Starting Docker VM';
    let descr = 'To run Docker containers on your computer, Kitematic is starting a Linux virtual machine. This may take a minute...';
    if (util.isNative()) {
      title = 'Checking Docker';
      descr = 'To run Docker containers on your computer, Kitematic is checking the Docker connection.';
    }
    return (
      <div className="setup">
        <Header hideLogin={true}/>
        <div className="setup-content">
          <div className="image">
            {this.renderContents()}
          </div>
          <div className="desc">
            <div className="content">
              <h1>{title}</h1>
              <p>{descr}</p>
            </div>
          </div>
        </div>
      </div>
    );
  },

  renderError: function () {
    let deleteVmAndRetry;

    if (util.isLinux()) {
      if (!this.state.started) {
        deleteVmAndRetry = (
          <button className="btn btn-action" onClick={this.handleLinuxDockerInstall}>Install Docker</button>
        );
      }
    } else if (util.isNative()) {
      deleteVmAndRetry = (
        <button className="btn btn-action" onClick={this.handleUseVbox}>Use VirtualBox</button>
      );
    } else if (this.state.started) {
      deleteVmAndRetry = (
        <button className="btn btn-action" onClick={this.handleErrorRemoveRetry}>Delete VM &amp; Retry Setup</button>
      );
    } else {
      if (this.state.error.sendUserTo && this.state.error.sendUserTo === 'hyperv-faq') {
        deleteVmAndRetry = (
          <button className="btn btn-action" onClick={this.handleHypervAdminError}>How to setup HyperV Admin</button>
        )
      } else {
        deleteVmAndRetry = (
          <button className="btn btn-action" onClick={this.handleToolBox}>Get Toolbox</button>
        );
      }
    }
    return (
      <div className="setup">
        <Header hideLogin={true}/>
        <div className="setup-content">
          <div className="image">
            <div className="contents">
              <RetinaImage src="install-error.png" checkIfRetinaImgExists={false}/>
              <div className="detail">
              </div>
            </div>
          </div>
          <div className="desc">
            <div className="content">
              <h4>Setup Error</h4>
              <h1>We&#39;re Sorry!</h1>
              <p>There seems to have been an unexpected error with Kitematic:</p>
              <p className="error">{this.state.error.message || this.state.error}</p>
              <p className="setup-actions">
                <button className="btn btn-action" onClick={this.handleErrorRetry}>Retry Setup</button>
                {{deleteVmAndRetry}}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },

  render: function () {
    if (this.state.error) {
      return this.renderError();
    } else {
      return this.renderProgress();
    }
  }
});

module.exports = Setup;
