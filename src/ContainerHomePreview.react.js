var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var exec = require('exec');
var ContainerStore = require('./ContainerStore');
var ContainerUtil = require('./ContainerUtil');
var Router = require('react-router');

var ContainerHomePreview = React.createClass({
  mixins: [Router.State, Router.Navigation],
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
    this.timer = setInterval(this.tick, 2000);
  },
  tick: function () {
    if (document.getElementById('web-preview-frame')) {
      var frameContent = document.getElementById('web-preview-frame').contentDocument;
      var $body = $(frameContent.body);
      if ($body.is(':empty')) {
        document.getElementById('web-preview-frame').contentDocument.location.reload(true);
      }
    }
  },
  componentWillUnmount: function() {
    clearInterval(this.timer);
  },
  init: function () {
    var container = ContainerStore.container(this.getParams().name);
    if (!container) {
      return;
    }
    var ports = ContainerUtil.ports(container);
    var webPorts = ['80', '8000', '8080', '3000', '5000', '2368'];
    this.setState({
      ports: ports,
      defaultPort: _.find(_.keys(ports), function (port) {
        return webPorts.indexOf(port) !== -1;
      })
    });
  },
  handleClickPreview: function () {
    if (this.state.defaultPort) {
      exec(['open', this.state.ports[this.state.defaultPort].url], function (err) {
        if (err) { throw err; }
      });
    }
  },
  handleClickNotShowingCorrectly: function () {
    this.transitionTo('containerSettingsPorts', {name: this.getParams().name});
  },
  render: function () {
    var preview;
    if (this.state.defaultPort) {
      preview = (
        <div className="web-preview wrapper">
          <h4>Web Preview</h4>
          <div className="widget">
            <iframe id="web-preview-frame" name="disable-x-frame-options" sandbox="allow-same-origin allow-scripts" src={this.state.ports[this.state.defaultPort].url} scrolling="no"></iframe>
            <div className="iframe-overlay" onClick={this.handleClickPreview}><span className="icon icon-upload-2"></span><div className="text">Open in Browser</div></div>
          </div>
          <div className="subtext" onClick={this.handleClickNotShowingCorrectly}>Not showing correctly?</div>
        </div>
      );
    } else {
      var ports = _.map(_.pairs(this.state.ports), function (pair) {
        var key = pair[0];
        var val = pair[1];
        return (
          <div key={key} className="ip-port">
            {val.display}
          </div>
        );
      });
      preview = (
        <div className="web-preview wrapper">
          <h4>IP &amp; Ports</h4>
          <div className="widget">
            <p>You can access this container from the outside using the following IP &amp; Port(s):</p>
            {ports}
          </div>
        </div>
      );
    }
    return preview;
  }
});

module.exports = ContainerHomePreview;
