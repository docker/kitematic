import _ from 'underscore';
import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import docker from '../utils/DockerUtil';
import containerActions from '../actions/ContainerActions';
import networkStore from '../stores/NetworkStore';
import Router from 'react-router';
import ContainerUtil from '../utils/ContainerUtil';
import containerStore from '../stores/ContainerStore';

var ContainerSettingsNetwork = React.createClass({
  mixins: [React.addons.LinkedStateMixin],

  contextTypes: {
    router: React.PropTypes.func
  },

  getInitialState: function () {
    let usedNetworks = this.getUsedNetworks(networkStore.all());
    var links =  ContainerUtil.links(this.props.container);
    return {
      networks: networkStore.all(),
      error: networkStore.getState().error,
      pending: networkStore.getState().pending,
      usedNetworks,
      links: links,
      newLink: {
        container: "",
        alias: "",
      },
      isNewLinkValid: false,
      containers: this.containerLinkOptions(containerStore.getState().containers)
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

  containerLinkOptions: function (containers) {
    const usedNetworks = _.keys(this.props.container.NetworkSettings.Networks);
    const currentContainerName =  this.props.container.Name;

    return _.values(containers).filter(function(container){

      var sameNetworks = _.keys(container.NetworkSettings.Networks).filter(function(network){
        return _.contains(usedNetworks, network);
      });

      if(container.State.Downloading){ // is downloading
        return false;
      }else if(container.Name == currentContainerName){ // is current container
        return false
      }else if (sameNetworks.length == 0) { // not in the same network
        return false;
      }else{
        return true;
      }
    }).sort(function (a, b) {
      return a.Name.localeCompare(b.Name);
    });
  },

  handleNewLink: function () {
    let links = this.state.links;
    links.push({
      alias: this.state.newLink.alias.trim(),
      container: this.state.newLink.container
    });
    this.setState({
      links,
      newLink: {
        container: "",
        alias: "",
      }
    });

    this.saveContainerLinks();
  },

  handleNewLinkContainerChange: function () {
    let newLink = this.state.newLink;
    newLink.container = event.target.value;
    this.setState({
      newLink
    });
    this.checkNewLink();
  },

  handleNewLinkAliasChange: function () {
    let newLink = this.state.newLink;
    newLink.alias = event.target.value;
    this.setState({
      newLink
    });
    this.checkNewLink();
  },

  checkNewLink: function () {
    this.setState({
      isNewLinkValid: this.state.newLink.container != ""
        && /[A-Za-z0-9\-]$/.test(this.state.newLink.alias)
    });
  },

  handleRemoveLink: function (event) {
    let links = this.state.links;
    links.splice( parseInt(event.target.name), 1);
    this.setState({
      links
    });

    this.saveContainerLinks();
  },

  saveContainerLinks: function () {
    var linksPaths = ContainerUtil.normalizeLinksPath(this.props.container, this.state.links);

    let hostConfig = _.extend(this.props.container.HostConfig, {Links: linksPaths});
    containerActions.update(this.props.container.Name, {HostConfig: hostConfig});
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

    let links = _.map(this.state.links, (link, key) => {
      return (
        <tr>
          <td>{link.container}</td>
          <td>{link.alias}</td>
          <td>
            <Router.Link to="container" params={{name: link.container}}>
              <a className="btn btn-action small">OPEN</a>
            </Router.Link>
            <a name={key} className="btn btn-action small" onClick={this.handleRemoveLink}>REMOVE</a>
          </td>
        </tr>
      )
    })

    let containerOptions = _.map(this.state.containers, (container) => {
      return (
        <option value={container.Name}>{container.Name}</option>
      )
    })

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
        <div className="settings-section">
          <h3>Links</h3>
          <table className="table links">
            <thead>
              <tr>
                <th>NAME</th>
                <th>ALIAS</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {links}
              <tr>
                <td>
                  <select className="line" value={this.state.newLink.container} onChange={this.handleNewLinkContainerChange}>
                    <option disabled value="">Select container</option>
                    {containerOptions}
                  </select>
                </td>
                <td>
                  <input id="new-link-alias" type="text" className="line" value={this.state.newLink.alias} onChange={this.handleNewLinkAliasChange} />
                </td>
                <td>
                  <a className="only-icon btn btn-positive small" disabled={!this.state.isNewLinkValid} onClick={this.handleNewLink}>
                    <span className="icon icon-add"></span>
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsNetwork;
