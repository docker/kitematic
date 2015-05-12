var React = require('react/addons');
var Router = require('react-router');
var ContainerDetailsHeader = require('./ContainerDetailsHeader.react');
var ContainerDetailsSubheader = require('./ContainerDetailsSubheader.react');
var containerUtil = require('../utils/ContainerUtil');
var util = require('../utils/Util');
var _ = require('underscore');

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
