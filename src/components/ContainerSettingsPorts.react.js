import _ from 'underscore';
import React from 'react/addons';
import shell from 'shell';
import ContainerUtil from '../utils/ContainerUtil';
import containerActions from '../actions/ContainerActions';
import containerStore from '../stores/ContainerStore';
import metrics from '../utils/MetricsUtil';
import {webPorts} from '../utils/Util';

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
    let ports = this.state.ports;
    let port = e.target.value;

    // save updated port
    ports[key] = _.extend(ports[key], {
      url: 'http://' + ports[key]['ip'] + ':' + port,
      port: port,
      error: null
    });

    // basic validation, if number is integer, if its in range, if there
    // is no collision with ports of other containers and also if there is no
    // collision with ports for current container
    const otherContainers = _.filter(_.values(containerStore.getState().containers), c => c.Name !== this.props.container.Name);
    const otherPorts = _.flatten(otherContainers.map(container => {
      return _.values(container.NetworkSettings.Ports).map(hosts => hosts.map(host => {return {port: host.HostPort, name: container.Name}}));
    })).reduce((prev, pair) => {
      prev[pair.port] = pair.name;
      return prev;
    }, {});

    const duplicates = _.filter(ports, (v, i) => {
      return (i != key && _.isEqual(v.port, port));
    });

    if (!port.match(/^[0-9]+$/g)) {
      ports[key].error = 'Needs to be an integer.';
    } else if (port <= 0 || port > 65535) {
      ports[key].error = 'Needs to be in range <1,65535>.';
    } else if (otherPorts[port]) {
      ports[key].error = 'Collision with container "'+ otherPorts[port] +'"';
    } else if (duplicates.length > 0) {
      ports[key].error = 'Collision with another port in this container.';
    } else if (port == 22 || port == 2376) {
      ports[key].error = 'Ports 22 and 2376 are reserved ports for Kitematic/Docker.';
    }
    this.setState({ports: ports});
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
      return false;
    }
    var isUpdating = (this.props.container.State.Updating);
    var isValid = true;
    var ports = _.map(_.pairs(this.state.ports), pair => {
      var key = pair[0];
      var {ip, port, url, error} = pair[1];
      isValid = (error) ? false : isValid;
      let ipLink = (this.props.container.State.Running && !this.props.container.State.Paused && !this.props.container.State.ExitCode && !this.props.container.State.Restarting) ? (<a onClick={this.handleViewLink.bind(this, url)}>{ip}</a>):({ip});
      return (
        <tr key={key}>
          <td>{key}</td>
          <td className="bind">
            {ipLink}:
            <input
              type="text"
              disabled={isUpdating}
              onChange={this.handleChangePort.bind(this, key)}
              defaultValue={port} />
          </td>
          <td className="error">{error}</td>
        </tr>
      );
    });
    return (
      <div className="settings-panel">
        <div className="settings-section">
          <h3>Configure Ports</h3>
          <table className="table ports">
            <thead>
              <tr>
                <th>DOCKER PORT</th>
                <th>MAC IP:PORT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ports}
            </tbody>
          </table>
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
