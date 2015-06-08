var _ = require('underscore');
var React = require('react/addons');
var request = require('request');
var shell = require('shell');
var metrics = require('../utils/MetricsUtil');

var ContainerHomePreview = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  reload: function () {
    var webview = document.getElementById('webview');
    if (webview) {
      var url = webview.src;
      request(url, err => {
        if (err && err.code === 'ECONNREFUSED') {
          setTimeout(this.reload, 2000);
        } else {
          try {
            webview.reload();
          } catch (err) {}
        }
      });
    }
  },

  componentWillUnmount: function() {
    clearInterval(this.timer);
  },

  handleClickPreview: function () {
    if (this.props.defaultPort) {
      metrics.track('Opened In Browser', {
        from: 'preview'
      });
      shell.openExternal(this.props.ports[this.props.defaultPort].url);
    }
  },

  handleClickNotShowingCorrectly: function () {
    metrics.track('Viewed Port Settings', {
      from: 'preview'
    });
    this.context.router.transitionTo('containerSettingsPorts', {name: this.context.router.getCurrentParams().name});
  },

  render: function () {
    var preview;
    if (this.props.defaultPort) {
      var frame = React.createElement('webview', {className: 'frame', id: 'webview', src: this.props.ports[this.props.defaultPort].url, autosize: 'on'});
      preview = (
        <div className="web-preview wrapper">
          <div className="widget">
            <div className="top-bar">
              <div className="text">WEB PREVIEW</div>
            </div>
            {frame}
            <div className="frame-overlay" onClick={this.handleClickPreview}><span className="icon icon-upload-2"></span><div className="text">Open in Browser</div></div>
          </div>
          <div className="subtext" onClick={this.handleClickNotShowingCorrectly}>Not showing correctly?</div>
        </div>
      );
    } else {
      var ports = _.map(_.pairs(this.props.ports), function (pair) {
        var key = pair[0];
        var val = pair[1];
        return (
          <div key={key} className="table-values">
            <span className="value-left">{key}</span><span className="icon icon-arrow-right"></span>
            <span className="value-right">{val.display}</span>
          </div>
        );
      });

      preview = (
        <div className="web-preview wrapper">
          <div className="widget">
            <div className="top-bar">
              <div className="text">IP & PORTS</div>
            </div>
            <p>You can access this container using the following IP address and port:</p>
            <div className="table ports">
              <div className="table-labels">
                <div className="label-left">DOCKER PORT</div>
                <div className="label-right">MAC PORT</div>
              </div>
              {ports}
            </div>
          </div>
        </div>
      );
    }
    return preview;
  }
});

module.exports = ContainerHomePreview;
