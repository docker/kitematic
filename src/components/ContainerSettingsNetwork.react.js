import _ from 'underscore';
import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import docker from '../utils/DockerUtil';
import containerActions from '../actions/ContainerActions';
import networkStore from '../stores/NetworkStore';

var ContainerSettingsNetwork = React.createClass({
  mixins: [React.addons.LinkedStateMixin],

  contextTypes: {
    router: React.PropTypes.func
  },

  getInitialState: function () {
    let usedNetworks = this.getUsedNetworks(networkStore.all());
    return {
      networks: networkStore.all(),
      error: networkStore.getState().error,
      pending: networkStore.getState().pending,
      usedNetworks
    };
  },

  getUsedNetworks(networks) {
    const usedKeys = _.keys(this.props.container.NetworkSettings.Networks);

    return _.object(_.map(networks, function (network) {
      return [network.Name, _.contains(usedKeys, network.Name)];
    }));
  },

  componentDidMount: function () {
    networkStore.listen(this.update);
  },

  componentWillUnmount: function () {
    networkStore.unlisten(this.update);
  },

  update: function () {
    let newState = {
      networks: networkStore.all(),
      error: networkStore.getState().error,
      pending: networkStore.getState().pending
    }; 
    if (!newState.pending) {
      newState.usedNetworks = this.getUsedNetworks(networkStore.all());
    }
    this.setState(newState);
  },

  handleSaveNetworkOptions: function () {
    metrics.track('Saved Network Options');
    let connectedNetworks = [];
    let disconnectedNetworks = [];
    let containerNetworks = this.props.container.NetworkSettings.Networks;
    let usedNetworks = this.state.usedNetworks;
    _.each(networkStore.all(), network => {
      let isConnected = _.has(containerNetworks, network.Name);
      if (isConnected !== usedNetworks[network.Name]) {
        if (isConnected) {
          disconnectedNetworks.push(network.Name);
        } else {
          connectedNetworks.push(network.Name);
        }
      }
    });
    if (connectedNetworks.length || disconnectedNetworks.length) {
      docker.updateContainerNetworks(this.props.container.Name, connectedNetworks, disconnectedNetworks);
    }
  },

  handleToggleNetwork: function (event) {
    let usedNetworks = _.clone(this.state.usedNetworks);
    let networkName = event.target.name;
    let newState = !usedNetworks[networkName];
    if (newState) {
      if (networkName === 'none') {
        usedNetworks = _.mapObject(usedNetworks, () => false);
      } else {
        usedNetworks['none'] = false;
      }
    }
    usedNetworks[networkName] = newState;
    this.setState({
      usedNetworks
    });
  },

  handleToggleHostNetwork: function () {
    let NetworkingConfig = {
      EndpointsConfig: {}
    };
    if (!this.state.usedNetworks.host) {
      NetworkingConfig.EndpointsConfig.host = {};
    }
    containerActions.update(this.props.container.Name, {NetworkingConfig});
  },

  render: function () {
    let isUpdating = (this.props.container.State.Updating || this.state.pending);
    let networks = _.map(this.state.networks, (network, index) => {
      if (network.Name !== 'host') {
        return (
          <tr key={network.Id}>
            <td><input type="checkbox" disabled={isUpdating || this.state.usedNetworks.host} name={network.Name} checked={this.state.usedNetworks[network.Name]} onChange={this.handleToggleNetwork}/></td>
            <td>{network.Name}</td>
            <td>{network.Driver}</td>
          </tr>
        )
      }
    });

    return (
      <div className="settings-panel">
        <div className="settings-section">
          <h3>Configure network</h3>
          <table className="table volumes">
            <thead>
              <tr>
                <th>&nbsp;</th>
                <th>NAME</th>
                <th>DRIVER</th>
              </tr>
            </thead>
            <tbody>
              {networks}
            </tbody>
          </table>
          { !this.state.usedNetworks.host ? <a className="btn btn-action" disabled={isUpdating} onClick={this.handleSaveNetworkOptions}>Save</a> : null }
          { this.state.usedNetworks.host ? <span>You cannot configure networks while container connected to host network</span> : null }
        </div>
        <div className="settings-section">
          <h3>Host network</h3>
          { !this.state.usedNetworks.host ? <a className="btn btn-action" disabled={isUpdating} onClick={this.handleToggleHostNetwork}>Connect to host network</a> : null }
          { this.state.usedNetworks.host ? <a className="btn btn-action" disabled={isUpdating} onClick={this.handleToggleHostNetwork}>Disconnect from host network</a> : null }
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsNetwork;
