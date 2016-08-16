import React from 'react/addons';
import RetinaImage from 'react-retina-image';
import util from '../utils/Util';
import metrics from '../utils/MetricsUtil';
import electron from 'electron';
const remote = electron.remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
import accountStore from '../stores/AccountStore';
import accountActions from '../actions/AccountActions';
import Router from 'react-router';
import classNames from 'classnames';

var Header = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      fullscreen: false,
      updateAvailable: false,
      username: accountStore.getState().username,
      verified: accountStore.getState().verified
    };
  },
  componentDidMount: function () {
    document.addEventListener('keyup', this.handleDocumentKeyUp, false);

    accountStore.listen(this.update);
  },
  componentWillUnmount: function () {
    document.removeEventListener('keyup', this.handleDocumentKeyUp, false);
    accountStore.unlisten(this.update);
  },
  update: function () {
    let accountState = accountStore.getState();
    this.setState({
      username: accountState.username,
      verified: accountState.verified
    });
  },
  handleDocumentKeyUp: function (e) {
    if (e.keyCode === 27 && remote.getCurrentWindow().isFullScreen()) {
      remote.getCurrentWindow().setFullScreen(false);
      this.forceUpdate();
    }
  },
  handleUserClick: function (e) {
    let menu = new Menu();

    if (!this.state.verified) {
      menu.append(new MenuItem({ label: 'I\'ve Verified My Email Address', click: this.handleVerifyClick}));
    }

    menu.append(new MenuItem({ label: 'Sign Out', click: this.handleLogoutClick}));
    menu.popup(remote.getCurrentWindow(), e.currentTarget.offsetLeft, e.currentTarget.offsetTop + e.currentTarget.clientHeight + 10);
  },
  handleLoginClick: function () {
    this.transitionTo('login');
    metrics.track('Opened Log In Screen');
  },
  handleLogoutClick: function () {
    metrics.track('Logged Out');
    accountActions.logout();
  },
  handleVerifyClick: function () {
    metrics.track('Verified Account', {
      from: 'header'
    });
    accountActions.verify();
  },
  renderLogo: function () {
      return (
          <div className="logo">
            <RetinaImage src="logo.png"/>
          </div>
      );
  },
  renderDashboardHeader: function () {
    let headerClasses = classNames({
      bordered: !this.props.hideLogin,
      header: true,
      'no-drag': true
    });
    let username;
    if (this.props.hideLogin) {
      username = null;
    } else if (this.state.username && !util.isWindows()) {
      username = (
        <div className="login-wrapper">
          <div className="login no-drag" onClick={this.handleUserClick}>
            <span className="icon icon-user"></span>
              <span className="text">
                {this.state.username}
                {this.state.verified ? null : '(Unverified)'}
              </span>
              <RetinaImage src="userdropdown.png"/>
          </div>
        </div>
      );
    } else if(util.isWindows()){
      username = (
          <div className="login no-drag" onClick={this.handleUserClick}>
            <span className="icon icon-user"></span>
              <span className="text">
                {this.state.username}
                {this.state.verified ? null : '(Unverified)'}
              </span>
            <RetinaImage src="userdropdown.png"/>
          </div>
      );
    }else{
      username = (
          <div className="login-wrapper">
            <div className="login no-drag" onClick={this.handleLoginClick}>
              <span className="icon icon-user"></span> LOGIN
            </div>
          </div>
      );
    }
    return (
      <div className={headerClasses}>
        <div className="left-header">
          {username}
        </div>
        <div className="right-header">
        {this.renderLogo()}
        </div>
      </div>
    );
  },
  renderBasicHeader: function () {
    let headerClasses = classNames({
      bordered: !this.props.hideLogin,
      header: true,
      'no-drag': true
    });
    return (
      <div className={headerClasses}>
      </div>
    );
  },
  render: function () {
    if (this.props.hideLogin) {
      return this.renderBasicHeader();
    } else {
      return this.renderDashboardHeader();
    }
  }
});

module.exports = Header;
