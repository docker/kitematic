var _ = require('underscore');
var React = require('react/addons');
var Router = require('react-router');
var exec = require('exec');
var ContainerStore = require('./ContainerStore');
var ContainerUtil = require('./ContainerUtil');
var metrics = require('./Metrics');

var ContainerSettingsPorts = React.createClass({
  mixins: [Router.State, Router.Navigation],
  getInitialState: function () {
    return {
      ports: {},
      defaultPort: null
    };
  },
  componentWillReceiveProps: function () {
    this.init();
  },
  componentDidMount: function() {
    this.init();
  },
  init: function () {
    var container = ContainerStore.container(this.getParams().name);
    if (!container) {
      return;
    }
    var ports = ContainerUtil.ports(container);
    var webPorts = ['80', '8000', '8080', '3000', '5000', '2368'];
    this.setState({
      ports: ports,
      defaultPort: _.find(_.keys(ports), function (port) {
        return webPorts.indexOf(port) !== -1;
      })
    });
  },
  handleViewLink: function (url) {
    metrics.track('Opened In Browser', {
      from: 'settings'
    });
    exec(['open', url], function (err) {
      if (err) { throw err; }
    });
  },
  handleChangeDefaultPort: function (port, e) {
    console.log(e.target.checked);
    if (e.target.checked) {
      this.setState({
        defaultPort: port
      });
    } else {
      this.setState({
        defaultPort: null
      });
    }
  },
  render: function () {
    if (!this.props.container) {
      return (<div></div>);
    }
    var ports = _.map(_.pairs(this.state.ports), pair => {
      var key = pair[0];
      var val = pair[1];
      return (
        <div key={key} className="table-values">
          <span className="value-left">{key}</span><span className="icon icon-arrow-right"></span>
          <a className="value-right" onClick={this.handleViewLink.bind(this, val.url)}>{val.display}</a>
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
              <div className="label-right">MAC PORT</div>
            </div>
            {ports}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsPorts;
