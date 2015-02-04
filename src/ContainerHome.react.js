var $ = require('jquery');
var React = require('react/addons');

var ContainerHome = React.createClass({
  componentDidUpdate: function () {
    // Scroll logs to bottom
    var parent = $('.mini-logs');
    if (parent.length) {
      if (parent.scrollTop() >= this._oldHeight) {
        parent.stop();
        parent.scrollTop(parent[0].scrollHeight - parent.height());
      }
      this._oldHeight = parent[0].scrollHeight - parent.height();
    }
  },
  render: function () {
    var preview;
    if (this.props.defaultPort) {
      preview = (
        <iframe src={this.props.ports[this.props.defaultPort].url}></iframe>
      );
    }
    return (
      <div className="details-panel home">
        <div className="content">
          <h4>Web Preview</h4>
          <div className="widget web-preview">
            {preview}
          </div>
          <div className="widget mini-logs">
            {this.props.logs}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerHome;
