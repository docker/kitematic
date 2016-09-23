import React from 'react/addons';
import request from 'request';
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

  handleClickPortSettings: function () {
    metrics.track('Viewed Port Settings', {
      from: 'preview'
    });
    this.context.router.transitionTo('containerSettingsPorts', {name: this.context.router.getCurrentParams().name});
  },

  render: function () {
    var preview;
    if (this.props.defaultPort) {
      preview = (<ContainerHomeWebPreview ports={this.props.ports} defaultPort={this.props.defaultPort} handleClickPortSettings={this.handleClickPortSettings}/>);
    } else {
      preview = (<ContainerHomeIpPortsPreview ports={this.props.ports} handleClickPortSettings={this.handleClickPortSettings}/>);
    }
    return preview;
  }
});

module.exports = ContainerHomePreview;
