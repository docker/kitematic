var React = require('react/addons');
var remote = require('remote');

var Header = React.createClass({
  getInitialState: function () {
    return {
      fullscreen: false
    };
  },
  componentDidMount: function () {
    document.addEventListener('keyup', this.handleDocumentKeyUp, false);
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
  render: function () {
    var buttons;
    if (this.state.fullscreen) {
      return (
        <div className="header no-drag">
          <div className="buttons">
            <div className="button button-close disabled"></div>
            <div className="button button-minimize disabled"></div>
            <div className="button button-fullscreenclose enabled" onClick={this.handleFullscreen}></div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="header">
          <div className="buttons">
            <div className="button button-close enabled" onClick={this.handleClose}></div>
            <div className="button button-minimize enabled" onClick={this.handleMinimize}></div>
            <div className="button button-fullscreen enabled" onClick={this.handleFullscreen}></div>
          </div>
        </div>
      );
    }
  }
});

module.exports = Header;
