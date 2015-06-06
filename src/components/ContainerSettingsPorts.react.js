var _ = require('underscore');
var React = require('react/addons');
var shell = require('shell');
var containerActions = require('../actions/ContainerActions');
var containerStore = require('../stores/ContainerStore');
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
  handleChangePort: function(key, e) {
    var ports = this.state.ports;
    var port = e.target.value;

    // save updated port
    ports[key] = _.extend(ports[key], {
      url: 'http://' + ports[key]['ip'] + ':' + port,
      port: port,
      error: null
    });

    // basic validation, if number is integer, if its in range, if there
    // is no collision with ports of other containers and also if there is no
    // collision with ports for current containser
    const name = this.props.container.Name;
    const containers = containerStore.getState().containers;
    const container = ContainerUtil.isPortCollision(name, containers, port);
    const duplicates = _.filter(ports, (v, i) => {
      return (i != key && _.isEqual(v.port, port));
    });
    if (!port.match(/^[0-9]+$/g)) {
      ports[key].error = 'Needs to be an integer.';
    }
    else if (port <= 0 || port > 65535) {
      ports[key].error = 'Needs to be in range <1,65535>.';
    }
    else if (container) {
      ports[key].error = 'Collision with port at container "'+ container.Name +'"';
    }
    else if (duplicates.length > 0) {
      ports[key].error = "Collision with other port at container.";
    }

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
    var isUpdating = (this.props.container.State.Updating);
    var isValid = true;
    var ports = _.map(_.pairs(this.state.ports), pair => {
      var key = pair[0];
      var {ip, port, url, error} = pair[1];
      isValid = (error) ? false : isValid;

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
            <span className="error">{error}</span>
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
             disabled={isUpdating || !isValid}
             onClick={this.handleSave}>
            Save
          </a>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsPorts;
