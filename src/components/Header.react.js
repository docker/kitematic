var React = require('react/addons');
var remote = require('remote');
var RetinaImage = require('react-retina-image');
var remote = require('remote');
var ipc = require('ipc');
var autoUpdater = remote.require('auto-updater');
var metrics = require('../utils/MetricsUtil');
var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');
var accountStore = require('../stores/AccountStore');
var accountActions = require('../actions/AccountActions');
var Router = require('react-router');
var classNames = require('classNames');

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

    ipc.on('application:update-available', () => {
      this.setState({
        updateAvailable: true
      });
    });
    autoUpdater.checkForUpdates();
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
  handleClose: function () {
    remote.getCurrentWindow().hide();
  },
  handleMinimize: function () {
    remote.getCurrentWindow().minimize();
  },
  handleFullscreen: function () {
    remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().isFullScreen());
    this.setState({
      fullscreen: remote.getCurrentWindow().isFullScreen()
    });
  },
  handleFullscreenHover: function () {
    this.update();
  },
  handleAutoUpdateClick: function () {
    metrics.track('Restarted to Update');
    ipc.send('application:quit-install');
  },
  handleUserClick: function (e) {
    let menu = new Menu();
    menu.append(new MenuItem({ label: 'Sign Out', click: this.handleLogoutClick.bind(this)}));
    menu.popup(remote.getCurrentWindow(), e.currentTarget.offsetLeft, e.currentTarget.offsetTop + e.currentTarget.clientHeight + 10);
  },
  handleLoginClick: function () {
    this.transitionTo('login');
  },
  handleLogoutClick: function () {
    accountActions.logout();
  },
  render: function () {
    let updateWidget = this.state.updateAvailable ? <a className="btn btn-action small no-drag" onClick={this.handleAutoUpdateClick}>UPDATE NOW</a> : null;
    let buttons;
    if (this.state.fullscreen) {
      buttons = (
        <div className="buttons">
          <div className="button button-close disabled"></div>
          <div className="button button-minimize disabled"></div>
          <div className="button button-fullscreenclose enabled" onClick={this.handleFullscreen}></div>
        </div>
      );
    } else {
      buttons = (
        <div className="buttons">
          <div className="button button-close enabled" onClick={this.handleClose}></div>
          <div className="button button-minimize enabled" onClick={this.handleMinimize}></div>
          <div className="button button-fullscreen enabled" onClick={this.handleFullscreen}></div>
        </div>
      );
    }

    let username;
    if (this.props.hideLogin) {
      username = null;
    } else if (this.state.username) {
      username = (
        <span className="no-drag" onClick={this.handleUserClick}>
          <RetinaImage src="user.png"/> {this.state.username} <RetinaImage src="userdropdown.png"/>
        </span>
      );
    } else {
      username = (
        <span className="no-drag" onClick={this.handleLoginClick}>
          <RetinaImage src="user.png"/> Log In
        </span>
      );
    }

    let headerClasses = classNames({
      bordered: !this.props.hideLogin,
      header: true,
      'no-drag': true
    });

    return (
      <div className={headerClasses}>
        {buttons}
        <div className="updates">
          {updateWidget}
        </div>
        <div className="login">
          {username}
        </div>
      </div>
    );
  }
});

module.exports = Header;
