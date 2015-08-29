import _ from 'underscore';
import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import ContainerUtil from '../utils/ContainerUtil';
import containerActions from '../actions/ContainerActions';

var ipRegex = /\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/;
var domainRegex = /([a-z0-9-]+\.(?:com|net|org|co\.uk|localhost|dev))(?:\/|$)/;

var ContainerSettingsAdvanced = React.createClass({
  mixins: [React.addons.LinkedStateMixin],

  contextTypes: {
    router: React.PropTypes.func
  },

  getInitialState: function () {
    let [tty, openStdin] = ContainerUtil.mode(this.props.container) || [true, true];
    let dns = ContainerUtil.dns(this.props.container) || { ip: null, search: null, error: null, errorDomain: null }
    return {
      tty: tty,
      openStdin: openStdin,
      dns: dns
    };
  },

  handleSaveAdvancedOptions: function () {
    metrics.track('Saved Advanced Options');
    let tty = this.state.tty;
    let openStdin = this.state.openStdin;
    let dns = this.state.dns;
    let dnsOptions = {Dns: null, DnsSearch: null};
    if (dns.ip) {
      dnsOptions["Dns"] = [dns.ip];
    }
    if (dns.search) {
      dnsOptions["DnsSearch"] = [dns.search];
    }
    var hostConfig = _.clone(this.props.container.HostConfig);
    hostConfig = _.extend(hostConfig, dnsOptions);
    containerActions.update(this.props.container.Name, {HostConfig: hostConfig, Tty: tty, OpenStdin: openStdin});
  },

  handleChangeTty: function () {
    this.setState({
      tty: !this.state.tty
    });
  },

  handleDnsChange: function(e) {
    let ip = e.target.value;
    let dns = _.clone(this.state.dns);
    if (ip != '' && !ipRegex.test(ip)) {
      dns.error = "IP must be valid";
    } else {
      dns.ip = ip;
      dns.error = null;
    }
    this.setState({
      dns: dns
    });
  },
  handleDnsSearchChange: function(e) {
    let dnsSearch = e.target.value;
    let dns = _.clone(this.state.dns);
    if (dnsSearch != '' && !domainRegex.test(dnsSearch)) {
      dns.errorDomain = "Domain must be valid";
    } else {
      dns.search = dnsSearch;
      dns.errorDomain = null;
    }
    this.setState({
      dns: dns
    });
  },

  handleChangeOpenStdin: function () {
    this.setState({
      openStdin: !this.state.openStdin
    });
  },

  render: function () {
    if (!this.props.container) {
      return false;
    }

    return (
      <div className="settings-panel">
        <div className="settings-section">
          <h3>Advanced Options</h3>
          <div className="checkboxes">
            <p><input type="checkbox" checked={this.state.tty} onChange={this.handleChangeTty}/>Allocate a TTY for this container</p>
            <p><input type="checkbox" checked={this.state.openStdin} onChange={this.handleChangeOpenStdin}/>Keep STDIN open even if not attached</p>
            <p>Use DNS IP <input id="input-dns-ip" type="text" className="line" placeholder="8.8.8.8" defaultValue={this.state.dns.ip} onChange={this.handleDnsChange}></input> <span className="text-danger">{this.state.dns.error}</span></p>
            <p>Use DNS Search<input id="input-dns-search" type="text" className="line" placeholder="domain.com" defaultValue={this.state.dns.search} onChange={this.handleDnsSearchChange}></input> <span className="text-danger">{this.state.dns.errorDomain}</span></p>
          </div>
          <a className="btn btn-action" disabled={this.props.container.State.Updating} onClick={this.handleSaveAdvancedOptions}>Save</a>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsAdvanced;
