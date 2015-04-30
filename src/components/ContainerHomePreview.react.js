var _ = require('underscore');
var React = require('react/addons');
var ContainerStore = require('../stores/ContainerStore');
var ContainerUtil = require('../utils/ContainerUtil');
var request = require('request');
var shell = require('shell');
var metrics = require('../utils/MetricsUtil');
var webPorts = require('../utils/Util').webPorts;

var ContainerHomePreview = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    return {
      ports: {},
      defaultPort: null
    };
  },
  componentWillReceiveProps: function () {
    this.init();
  },
  componentDidMount: function() {
    this.init();
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
  init: function () {
    var container = ContainerStore.container(this.context.router.getCurrentParams().name);
    if (!container) {
      return;
    }
    var ports = ContainerUtil.ports(container);
    this.setState({
      ports: ports,
      defaultPort: _.find(_.keys(ports), function (port) {
        return webPorts.indexOf(port) !== -1;
      })
    });
  },
  handleClickPreview: function () {
    if (this.state.defaultPort) {
      metrics.track('Opened In Browser', {
        from: 'preview'
      });
      shell.openExternal(this.state.ports[this.state.defaultPort].url);
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
    if (this.state.defaultPort) {
      var frame = React.createElement('webview', {className: 'frame', id: 'webview', src: this.state.ports[this.state.defaultPort].url, autosize: 'on'});
      preview = (
        <div className="web-preview wrapper">
          <h4>Web Preview</h4>
          <div className="widget">
            {frame}
            <div className="frame-overlay" onClick={this.handleClickPreview}><span className="icon icon-upload-2"></span><div className="text">Open in Browser</div></div>
          </div>
          <div className="subtext" onClick={this.handleClickNotShowingCorrectly}>Not showing correctly?</div>
        </div>
      );
    } else {
      var ports = _.map(_.pairs(this.state.ports), function (pair) {
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
          <h4>IP &amp; Ports</h4>
          <div className="widget">
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
