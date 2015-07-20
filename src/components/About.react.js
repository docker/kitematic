import React from 'react/addons';
import metrics from '../utils/MetricsUtil';
import utils from '../utils/Util';
import Router from 'react-router';
import RetinaImage from 'react-retina-image';
var packages;

try {
  packages = utils.packagejson();
} catch (err) {
  packages = {};
}

var Preferences = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      metricsEnabled: metrics.enabled()
    };
  },
  handleGoBackClick: function () {
    this.goBack();
    metrics.track('Went Back From About');
  },
  render: function () {
    return (
      <div className="preferences">
        <div className="preferences-content">
          <a onClick={this.handleGoBackClick}>Go Back</a>
          <RetinaImage src="banner.png"/>
          <table className="table">
            <thead>
              <tr>
                <th>APP NAME</th>
                <th>VERSION</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{packages.name}</td>
                <td>{packages.version}</td>
              </tr>
              <tr>
                <td>Docker</td>
                <td>{packages["docker-version"]}</td>
              </tr>
              <tr>
                <td>Docker Machine</td>
                <td>{packages["docker-machine-version"]}</td>
              </tr>
              <tr>
                <td>Docker Compose</td>
                <td>{packages["docker-compose-version"]}</td>
              </tr>
              <tr>
                <td>VirtualBox</td>
                <td>{packages["virtualbox-version"]}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
