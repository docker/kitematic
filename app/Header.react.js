var React = require('react/addons');
var remote = require('remote');

var Header = React.createClass({
  handleClose: function () {
    remote.getCurrentWindow().hide();
  },
  handleMinimize: function () {
    remote.getCurrentWindow().minimize();
  },
  handleFullscreen: function () {
    var isFullscreen = remote.getCurrentWindow().isFullScreen();
    remote.getCurrentWindow().setFullScreen(!isFullscreen);
    this.forceUpdate();
  },
  handleFullscreenHover: function () {
    this.update();
  },
  render: function () {
    var fullscreenButton;
    if (remote.getCurrentWindow().isFullScreen()) {
      fullscreenButton = <div className="button button-fullscreenclose" onClick={this.handleFullscreen}></div>;
    } else {
      fullscreenButton = <div className="button button-fullscreen" onClick={this.handleFullscreen}></div>;
    }

    return (
      <div className="header">
        <div className="buttons">
          <div className="button button-close" onClick={this.handleClose}></div>
          <div className="button button-minimize" onClick={this.handleMinimize}></div>
          {fullscreenButton}
        </div>
      </div>
    );
  }
});

module.exports = Header;
