import React from 'react/addons';
import Router from 'react-router';
import ContainerDetailsHeader from './ContainerDetailsHeader.react';
import ContainerDetailsSubheader from './ContainerDetailsSubheader.react';
import containerUtil from '../utils/ContainerUtil';
import util from '../utils/Util';
import _ from 'underscore';

var ContainerDetails = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  render: function () {
    if (!this.props.container) {
      return false;
    }

    let ports = containerUtil.ports(this.props.container);
    let defaultPort = _.find(_.keys(ports), port => {
      return util.webPorts.indexOf(port) !== -1;
    });

    return (
      <div className="details">
        <ContainerDetailsHeader {...this.props} defaultPort={defaultPort} ports={ports}/>
        <ContainerDetailsSubheader {...this.props} defaultPort={defaultPort} ports={ports}/>
        <Router.RouteHandler {...this.props} defaultPort={defaultPort} ports={ports}/>
      </div>
    );
  }
});

module.exports = ContainerDetails;
