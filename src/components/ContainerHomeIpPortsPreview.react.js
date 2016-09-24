import _ from 'underscore';
import React from 'react/addons';

var ContainerHomeIpPortsPreview = React.createClass({
  handleClickPortSettings: function () {
    this.props.handleClickPortSettings();
  },

  render: function () {
    var ports = _.map(_.pairs(this.props.ports), pair => {
      var key = pair[0];
      var val = pair[1];
      return (
          <tr key={key}>
            <td>{key + '/' + val.portType}</td>
            <td>{val.url}</td>
          </tr>
      );
    });

    return (
      <div className="web-preview wrapper">
        <div className="widget">
          <div className="top-bar">
            <div className="text">IP & PORTS</div>
            <div className="action" onClick={this.handleClickPortSettings}>
              <span className="icon icon-preferences"></span>
            </div>
          </div>
          <p>You can access this container using the following IP address and port:</p>
          <table className="table">
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

module.exports = ContainerHomeIpPortsPreview;
