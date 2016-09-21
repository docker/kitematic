import React from 'react/addons';
import request from 'request';
import shell from 'shell';
import metrics from '../utils/MetricsUtil';
import ContainerHomeWebPreview from './ContainerHomeWebPreview.react';
import ContainerHomeIpPortsPreview from './ContainerHomeIpPortsPreview.react';

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

  componentWillUnmount: function () {
    clearInterval(this.timer);
  },

  handleClickPreview: function () {
    if (this.props.defaultPort) {
      metrics.track('Opened In Browser', {
        from: 'preview'
      });
      shell.openExternal('http://' + this.props.ports[this.props.defaultPort].url);
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
      preview = (<ContainerHomeWebPreview ports={this.props.ports} defaultPort={this.props.defaultPort}/>);
    } else {
      preview = (<ContainerHomeIpPortsPreview ports={this.props.ports}/>);
    }
    return preview;
  }
});

module.exports = ContainerHomePreview;
