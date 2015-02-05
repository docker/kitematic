var $ = require('jquery');
var React = require('react/addons');

var ContainerHome = React.createClass({
  handleResize: function () {
    $('.web-preview').height(window.innerHeight - 240);
    $('.mini-logs').height(window.innerHeight / 2 - 100);
    $('.folders').height(window.innerHeight / 2 - 150);
  },
  componentDidMount: function() {
    $('.web-preview').height(window.innerHeight - 240);
    $('.mini-logs').height(window.innerHeight / 2 - 100);
    $('.folders').height(window.innerHeight / 2 - 150);
    window.addEventListener('resize', this.handleResize);
  },
  componentWillUnmount: function() {
    window.removeEventListener('resize', this.handleResize);
  },
  componentDidUpdate: function () {
    // Scroll logs to bottom
    $('.web-preview').height(window.innerHeight - 240);
    $('.mini-logs').height(window.innerHeight / 2 - 100);
    $('.folders').height(window.innerHeight / 2 - 150);
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
        <div className="web-preview">
          <h4>Web Preview</h4>
          <div className="widget">
            <iframe src={this.props.ports[this.props.defaultPort].url}></iframe>
          </div>
        </div>
      );
    }
    return (
      <div className="details-panel home">
        <div className="content">
          <div className="left">
            {preview}
          </div>
          <div className="right">
            <div className="mini-logs">
              <h4>Logs</h4>
              <div className="widget">
                {this.props.logs}
              </div>
            </div>
            <div className="folders">
              <h4>Edit Files</h4>
              <div className="widget">
                <p>Buncha folders</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerHome;
