var React = require('react/addons');
var Router = require('react-router');
var RetinaImage = require('react-retina-image');
var Header = require('./Header.react');
var metrics = require('../utils/MetricsUtil');
var accountStore = require('../stores/AccountStore');
var accountActions = require('../actions/AccountActions');

module.exports = React.createClass({
  mixins: [Router.Navigation],

  getInitialState: function () {
    return accountStore.getState();
  },

  handleSkip: function () {
    accountActions.skip();
    this.transitionTo('search');
    metrics.track('Skipped Signup');
  },

  handleClose: function () {
    this.goBack();
    metrics.track('Closed Signup');
  },

  componentDidMount: function () {
    accountStore.listen(this.update);
  },

  update: function () {
    this.setState(accountStore.getState());
  },

  render: function () {
    let close = this.state.prompted ?
        <a className="btn btn-action btn-skip" onClick={this.handleClose}>Close</a> :
        <a className="btn btn-action btn-skip" onClick={this.handleSkip}>Skip For Now</a>;

    return (
      <div className="setup">
        <Header hideLogin={true}/>
        <div className="setup-content">
          <div className="form-section">
            <RetinaImage src={'connect-to-hub.png'} checkIfRetinaImgExists={false}/>
            <Router.RouteHandler errors={this.state.errors} loading={this.state.loading} {...this.props}/>
          </div>
          <div className="desc">
            <div className="content">
              <h1>Connect to Docker Hub</h1>
              <p>Pull and run private Docker Hub images by connecting your Docker Hub account to Kitematic.</p>
              {close}
            </div>
          </div>
        </div>
      </div>
    );
  }
});
