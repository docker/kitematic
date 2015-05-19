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
var Router = require('react-router');

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

    ipc.on('application:update-available', () => {
      this.setState({
        updateAvailable: true
      });
    });
    autoUpdater.checkForUpdates();
  },
  componentWillUnmount: function () {
    document.removeEventListener('keyup', this.handleDocumentKeyUp, false);
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
    menu.append(new MenuItem({ label: 'Sign Out', click: function() { console.log('item 1 clicked'); } }));
    menu.popup(remote.getCurrentWindow(), e.currentTarget.offsetLeft, e.currentTarget.offsetTop + e.currentTarget.clientHeight + 10);
  },
  handleLoginClick: function () {
    this.transitionTo('login');
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
      username = <span>{this.state.username}</span>;
    } else {
      username = (
        <span className="no-drag" onClick={this.handleLoginClick}>
          <RetinaImage src="user.png"/> Log In
        </span>
      );
    }

    return (
      <div className="header no-drag">
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
