var React = require('react/addons');
var remote = require('remote');

var Header = React.createClass({
  handleClose: function () {
    remote.getCurrentWindow().hide();
  },
  handleMinimize: function () {
    remote.getCurrentWindow().minimize();
  },
  handleMaximize: function () {
    remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().isFullScreen());
  },
  render: function () {
    return (
      <div className="header">
        <div className="buttons">
          <div className="button button-close" onClick={this.handleClose}></div>
          <div className="button button-minimize" onClick={this.handleMinimize}></div>
          <div className="button button-maximize" onClick={this.handleMaximize}></div>
        </div>
      </div>
    );
  }
});

module.exports = Header;
