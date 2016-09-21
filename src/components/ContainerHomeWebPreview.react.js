import React from 'react/addons';

var ContainerHomeWebPreview = React.createClass({
  render: function () {
    var frame = React.createElement('webview', {className: 'frame', id: 'webview', src: 'http://' + this.props.ports[this.props.defaultPort].url, autosize: 'on'});
    return (
      <div className="web-preview wrapper">
        <div className="widget">
          <div className="top-bar">
            <div className="text">Web Preview</div>
            <div className="action" onClick={this.handleClickPreview}>
              <span className="icon icon-open-external"></span>
            </div>
            <div className="action" onClick={this.handleClickNotShowingCorrectly}>
              <span className="icon icon-preferences"></span>
            </div>
          </div>
          {frame}
          <div onClick={this.handleClickPreview} className="frame-overlay"></div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerHomeWebPreview;
