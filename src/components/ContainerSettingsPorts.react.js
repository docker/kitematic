var _ = require('underscore');
var React = require('react/addons');
var shell = require('shell');
var containerActions = require('../actions/ContainerActions');
var ContainerUtil = require('../utils/ContainerUtil');
var metrics = require('../utils/MetricsUtil');

var ContainerSettingsPorts = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    return {
      ports: ContainerUtil.ports(this.props.container)
    };
  },
  handleViewLink: function (url) {
    metrics.track('Opened In Browser', {
      from: 'settings'
    });
    shell.openExternal(url);
  },
  handleChangePort: function(key, e) {;
    var ports = this.state.ports;
    ports[key] = _.extend(ports[key], {
      url: 'http://' + ports[key]['ip'] + ':' + e.target.value,
      port: e.target.value
    });

    this.setState({ ports: ports });
  },
  handleSave: function() {
    containerActions.update(this.props.container.Name, {
      NetworkSettings: {
        Ports: _.reduce(this.state.ports, function(res, value, key) {
          res[key + '/tcp'] = [{
            HostIp: value.ip,
            HostPort: value.port,
          }];
          return res;
        }, {})
      }
    });
  },
  render: function () {
    if (!this.props.container) {
      return (<div></div>);
    }
    var ports = _.map(_.pairs(this.state.ports), pair => {
      var key = pair[0];
      var ip = pair[1].ip;
      var port = pair[1].port;
      var url = pair[1].url;
      return (
        <div key={key} className="table-values">
          <span className="value-left">{key}</span>
          <span className="icon icon-arrow-right"></span>
          <span className="value-right">
            <a onClick={this.handleViewLink.bind(this, url)}>{ip}</a>:
            <input
              type="text"
              className="line"
              onChange={this.handleChangePort.bind(this, key)}
              defaultValue={port}></input>
          </span>
        </div>
      );
    });
    return (
      <div className="settings-panel">
        <div className="settings-section">
          <h3>Configure Ports</h3>
          <div className="table ports">
            <div className="table-labels">
              <div className="label-left">DOCKER PORT</div>
              <div className="label-right">MAC IP:PORT</div>
            </div>
            {ports}
          </div>
          <a className="btn btn-action"
             disabled={this.props.container.State.Updating}
             onClick={this.handleSave}>
            Save
          </a>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsPorts;
