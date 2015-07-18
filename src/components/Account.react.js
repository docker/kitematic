import React from 'react/addons';
import Router from 'react-router';
import RetinaImage from 'react-retina-image';
import Header from './Header.react';
import metrics from '../utils/MetricsUtil';
import accountStore from '../stores/AccountStore';
import accountActions from '../actions/AccountActions';

module.exports = React.createClass({
  mixins: [Router.Navigation],

  getInitialState: function () {
    return accountStore.getState();
  },

  componentDidMount: function () {
    document.addEventListener('keyup', this.handleDocumentKeyUp, false);
    accountStore.listen(this.update);
  },

  componentWillUnmount: function () {
    document.removeEventListener('keyup', this.handleDocumentKeyUp, false);
    accountStore.unlisten(this.update);
  },

  componentWillUpdate: function (nextProps, nextState) {
    if (!this.state.username && nextState.username) {
      if (nextState.prompted) {
        this.goBack();
      } else {
        this.transitionTo('search');
      }
    }
  },

  handleSkip: function () {
    accountActions.skip();
    this.transitionTo('search');
    metrics.track('Skipped Login');
  },

  handleClose: function () {
    this.goBack();
    metrics.track('Closed Login');
  },

  update: function () {
    this.setState(accountStore.getState());
  },

  render: function () {
    let close = this.state.prompted ?
        <a className="btn btn-action btn-close" disabled={this.state.loading} onClick={this.handleClose}>Close</a> :
        <a className="btn btn-action btn-skip"  disabled={this.state.loading} onClick={this.handleSkip}>Skip For Now</a>;

    return (
      <div className="setup">
        <Header hideLogin={true}/>
        <div className="setup-content">
          {close}
          <div className="form-section">
            <RetinaImage src={'connect-to-hub.png'} checkIfRetinaImgExists={false}/>
            <Router.RouteHandler errors={this.state.errors} loading={this.state.loading} {...this.props}/>
          </div>
          <div className="desc">
            <div className="content">
              <h1>Connect to Docker Hub</h1>
              <p>Pull and run private Docker Hub images by connecting your Docker Hub account to Kitematic.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
});
