import React from 'react/addons';
import Router from 'react-router';
import Radial from './Radial.react.js';
import RetinaImage from 'react-retina-image';
import Header from './Header.react';
import Util from '../utils/Util';
import metrics from '../utils/MetricsUtil';
import setupStore from '../stores/SetupStore';

var Setup = React.createClass({
  mixins: [Router.Navigation],

  getInitialState: function () {
    return setupStore.getState();
  },

  componentDidMount: function () {
    setupStore.listen(this.update);
  },

  componentDidUnmount: function () {
    setupStore.unlisten(this.update);
  },

  update: function () {
    this.setState(setupStore.getState());
  },

  renderContents: function () {
    return (
      <div className="contents">
        <RetinaImage src="boot2docker.png" checkIfRetinaImgExists={false}/>
        <div className="detail">
          <Radial progress={this.state.progress} thick={true} gray={true}/>
        </div>
      </div>
    );
  },

  renderProgress: function () {
    return (
      <div className="setup">
        <Header hideLogin={true}/>
        <div className="setup-content">
          <div className="image">
            {this.renderContents()}
          </div>
          <div className="desc">
            <div className="content">
              <h1>{this.state.title}</h1>
              <p>{this.state.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  },
  renderCancelled: function () {
    return (
      <div className="setup">
        <Header hideLogin={true}/>
        <div className="setup-content">
          <div className="image">
            {this.renderContents()}
          </div>
          <div className="desc">
            <div className="content">
              <h4>Setup Cancelled</h4>
              <h1>Couldn&#39;t Install Requirements</h1>
              <p>Kitematic didn&#39;t receive the administrative privileges required to install or upgrade VirtualBox &amp; Docker.</p>
              <p>Please click retry. If VirtualBox is not installed, you can download &amp; install it manually from the <a onClick={this.handleOpenWebsite}>official Oracle website</a>.</p>
              <p><button className="btn btn-action" onClick={this.handleCancelRetry}>Retry</button></p>
            </div>
          </div>
        </div>
      </div>
    );
  },
  renderError: function () {
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
                <button className="btn btn-action" onClick={this.handleErrorRemoveRetry}>Delete VM and Retry Setup</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },

  render: function () {
    if (this.state.cancelled) {
      return this.renderCancelled();
    } else if (this.state.error) {
      return this.renderError();
    } else {
      return this.renderProgress();
    }
  }
});

module.exports = Setup;
