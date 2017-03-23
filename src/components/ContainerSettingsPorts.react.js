import _ from 'underscore';
import React from 'react/addons';
import shell from 'shell';
import ContainerUtil from '../utils/ContainerUtil';
import containerActions from '../actions/ContainerActions';
import containerStore from '../stores/ContainerStore';
import metrics from '../utils/MetricsUtil';
import docker from '../utils/DockerUtil';
import {webPorts} from '../utils/Util';
import {DropdownButton, MenuItem} from 'react-bootstrap';

var ContainerSettingsPorts = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    var ports = ContainerUtil.ports(this.props.container);
    var initialPorts = this.props.container.InitialPorts;
    ports[''] = {
      ip: docker.host,
      url: '',
      port: '',
      portType: 'tcp',
      error: null
    };
    return {
      ports: ports,
      initialPorts: initialPorts,
      hostname: this.props.container.Config.Hostname
    };
  },
  handleViewLink: function (url) {
    metrics.track('Opened In Browser', {
      from: 'settings'
    });
    shell.openExternal('http://' + url);
  },
  createEmptyPort: function (ports) {
    ports[''] = {
      ip: docker.host,
      url: '',
      port: '',
      portType: 'tcp'
    };
    document.getElementById('portKey').value = '';
    document.getElementById('portValue').value = '';
  },
  addPort: function () {
    if (document.getElementById('portKey') !== null) {
      var portKey = document.getElementById('portKey').value;
      var portValue = document.getElementById('portValue').value;
      var portTypeValue = document.getElementById('portType').textContent;
      var ports = this.state.ports;
      if (portKey !== '') {
        ports[portKey] = {
          ip: docker.host,
          url: docker.host + ':' + portValue,
          port: portValue,
          portType: portTypeValue.trim(),
          error: null
        };

        this.checkPort(ports, portKey, portKey);
        if (ports[portKey].error === null) {
          this.createEmptyPort(ports);
        }
      }
    }
    return ports;
  },
  handleAddPort: function (e) {
    var ports = this.addPort();
    this.setState({ports: ports});
    metrics.track('Added Pending Port');
  },
  checkPort: function (ports, port, key) {
    // basic validation, if number is integer, if its in range, if there
    // is no collision with ports of other containers and also if there is no
    // collision with ports for current container
    const otherContainers = _.filter(_.values(containerStore.getState().containers), c => c.Name !== this.props.container.Name);
    const otherPorts = _.flatten(otherContainers.map(container => {
      try {
        return _.values(container.NetworkSettings.Ports).map(hosts => hosts.map(host => {
          return {port: host.HostPort, name: container.Name};
        })
      );
      }catch (err) {

      }
    })).reduce((prev, pair) => {
      try {
        prev[pair.port] = pair.name;
      }catch (err) {

      }
      return prev;
    }, {});

    const duplicates = _.filter(ports, (v, i) => {
      return (i !== key && _.isEqual(v.port, port));
    });

    if (!port.match(/^[0-9]+$/g)) {
      ports[key].error = 'Needs to be an integer.';
    } else if (port <= 0 || port > 65535) {
      ports[key].error = 'Needs to be in range <1,65535>.';
    } else if (otherPorts[port]) {
      ports[key].error = 'Collision with container "' + otherPorts[port] + '"';
    } else if (duplicates.length > 0) {
      ports[key].error = 'Collision with another port in this container.';
    } else if (port === 22 || port === 2376) {
      ports[key].error = 'Ports 22 and 2376 are reserved ports for Kitematic/Docker.';
    }
  },
  handleChangePort: function (key, e) {
    let ports = this.state.ports;
    let port = e.target.value;
    // save updated port
    ports[key] = _.extend(ports[key], {
      url: ports[key].ip + ':' + port,
      port: port,
      error: null
    });
    this.checkPort(ports, port, key);

    this.setState({ports: ports});
  },
  handleChangePortKey: function (key, e) {
    let ports = this.state.ports;
    let portKey = e.target.value;

    // save updated port
    var currentPort = ports[key];

    delete ports[key];
    ports[portKey] = currentPort;

    this.setState({ports: ports});
  },
  handleRemovePort: function (key, e) {
    let ports = this.state.ports;
    delete ports[key];
    this.setState({ports: ports});
  },
  handleChangePortType: function (key, portType) {
    let ports = this.state.ports;
    let port = ports[key].port;

    // save updated port
    ports[key] = _.extend(ports[key], {
      url: ports[key].ip + ':' + port,
      port: port,
      portType: portType,
      error: null
    });
    this.setState({ports: ports});
  },
  isInitialPort: function (key, ports) {
    for (var idx in ports) {
      if (ports.hasOwnProperty(idx)) {
        var p = idx.split('/');
        if (p.length > 0) {
          if (p[0] === key) {
            return true;
          }
        }
      }
    }
    return false;
  },
  handleChangeHostnameEnabled: function (e) {
    var value = e.target.value;
    this.setState({
      hostname: value
    });
  },
  handleSave: function () {
    let ports = this.state.ports;
    ports = this.addPort();
    this.setState({ports: ports});
    let exposedPorts = {};
    let portBindings = _.reduce(ports, (res, value, key) => {
      if (key !== '') {
        res[key + '/' + value.portType] = [{
          HostPort: value.port
        }];
        exposedPorts[key + '/' + value.portType] = {};
      }
      return res;
    }, {});

    let hostConfig = _.extend(this.props.container.HostConfig, {PortBindings: portBindings, Hostname: this.state.hostname});
    let config = _.extend(this.props.container.Config, {Hostname: this.state.hostname});
    containerActions.update(this.props.container.Name, {ExposedPorts: exposedPorts, HostConfig: hostConfig, Config: config});

  },
  render: function () {
    if (!this.props.container) {
      return false;
    }
    var isUpdating = (this.props.container.State.Updating);
    var isValid = true;

    var ports = _.map(_.pairs(this.state.ports), pair => {
      var key = pair[0];
      var {ip, port, url, portType, error} = pair[1];
      isValid = (error) ? false : isValid;
      let ipLink = (this.props.container.State.Running && !this.props.container.State.Paused && !this.props.container.State.ExitCode && !this.props.container.State.Restarting) ? (<a onClick={this.handleViewLink.bind(this, url)}>{ip}</a>) : ({ip});
      var icon = '';
      var portKey = '';
      var portValue = '';
      if (key === '') {
        icon = <td><a disabled={isUpdating} onClick={this.handleAddPort} className="only-icon btn btn-positive small"><span className="icon icon-add"></span></a></td>;
        portKey = <input id={'portKey' + key} type="text" disabled={isUpdating} defaultValue={key} />;
        portValue = <input id={'portValue' + key} type="text" disabled={isUpdating} defaultValue={port} />;
      }else {
        if (this.isInitialPort(key, this.state.initialPorts)) {
          icon = <td></td>;
        }else {
          icon = <td><a disabled={isUpdating} onClick={this.handleRemovePort.bind(this, key)} className="only-icon btn btn-action small"><span className="icon icon-delete"></span></a></td>;
        }
        portKey = <input id={'portKey' + key} type="text" onChange={this.handleChangePortKey.bind(this, key)} disabled={isUpdating} defaultValue={key} />;
        portValue = <input id={'portValue' + key} type="text" onChange={this.handleChangePort.bind(this, key)} disabled={isUpdating} defaultValue={port} />;
      }
      return (
        <tr key={key}>
          <td>{portKey}</td>
          <td className="bind">
            {ipLink}:
            {portValue}
          </td>
          <td>
            <DropdownButton disabled={isUpdating} id= {'portType' + key } bsStyle="primary" title={portType} >
              <MenuItem onSelect={this.handleChangePortType.bind(this, key, 'tcp')} key={key + '-tcp'}>TCP</MenuItem>
              <MenuItem onSelect={this.handleChangePortType.bind(this, key, 'udp')} key={key + '-udp'}>UDP</MenuItem>
            </DropdownButton>
          </td>
          {icon}
          <td className="error">{error}</td>
        </tr>
      );
    });
    return (
      <div className="settings-panel">
        <div className="settings-section">
          <h3>Configure Hostname</h3>
          <div className="container-info-row">
            <div className="label-hostname">HOSTNAME</div>
            <input id="hostname" className="line" type="text" disabled={isUpdating} value={this.state.hostname} onChange={this.handleChangeHostnameEnabled}/>
          </div>
        </div>
        <div className="settings-section">
          <h3>Configure Ports</h3>
          <table className="table ports">
            <thead>
              <tr>
                <th>DOCKER PORT</th>
                <th>PUBLISHED IP:PORT</th>
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
