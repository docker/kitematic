var _ = require('underscore');
var React = require('react/addons');
var shell = require('shell');
var ContainerUtil = require('../utils/ContainerUtil');
var metrics = require('../utils/MetricsUtil');
var webPorts = require('../utils/Util').webPorts;

var ContainerSettingsPorts = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    return {
      ports: {},
      defaultPort: null
    };
  },
  componentDidMount: function() {
    if (!this.props.container) {
      return;
    }
    var ports = ContainerUtil.ports(this.props.container);
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
    shell.openExternal(url);
  },
  handleChangeDefaultPort: function (port, e) {
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
      return false;
    }
    var ports = _.map(_.pairs(this.state.ports), pair => {
      var key = pair[0];
      var val = pair[1];
      return (
        <tr key={key}>
          <td>{key}</td>
          <td><a onClick={this.handleViewLink.bind(this, val.url)}>{val.display}</a></td>
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
                <th>ACCESS URL</th>
              </tr>
            </thead>
            <tbody>
              {ports}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsPorts;
