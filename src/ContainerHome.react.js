var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var RetinaImage = require('react-retina-image');
var path = require('path');
var exec = require('exec');

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
  handleClickFolder: function (path) {
    exec(['open', path], function (err) {
      if (err) { throw err; }
    });
  },
  handleClickPreview: function () {
    if (this.props.defaultPort) {
      exec(['open', this.props.ports[this.props.defaultPort].url], function (err) {
        if (err) { throw err; }
      });
    }
  },
  render: function () {
    var preview;
    if (this.props.defaultPort) {
      preview = (
        <div className="web-preview">
          <h4>Web Preview</h4>
          <div className="widget">
            <iframe sandbox="allow-same-origin allow-scripts" src={this.props.ports[this.props.defaultPort].url} scrolling="no"></iframe>
            <div className="iframe-overlay" onClick={this.handleClickPreview}><span className="icon icon-upload-2"></span><div className="text">Open in Browser</div></div>
          </div>
          <div className="subtext">Not showing correctly?</div>
        </div>
      );
    }
    console.log(this.props.container.Volumes);
    var self = this;
    var folders = _.map(self.props.container.Volumes, function (val, key) {
      var firstFolder = key.split(path.sep)[1];
      if (!val || val.indexOf(process.env.HOME) === -1) {
        return;
      } else {
        return (
          <div key={key} className="folder" onClick={self.handleClickFolder.bind(self, val)}>
            <RetinaImage src="folder.png" />
            <div className="text">{firstFolder}</div>
          </div>
        );
      }
    });
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
                <div className="mini-logs-overlay"><span className="icon icon-scale-spread-1"></span><div className="text">Full Logs</div></div>
              </div>
            </div>
            <div className="folders">
              <h4>Edit Files</h4>
              <div className="widget">
                {folders}
              </div>
              <div className="subtext">Change Folders</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerHome;
