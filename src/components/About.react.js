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
        <div className="about-content">
          <a onClick={this.handleGoBackClick}>Go Back</a>
          <h2>Installed Software</h2>
          <div className="row">
            <div className="col-md-6">
              <RetinaImage src="cartoon-kitematic.png"/>
              <h3>{packages.name}</h3>
              <p>{packages.version}</p>
            </div>
            <div className="col-md-6">
              <RetinaImage src="cartoon-docker.png"/>
              <h3>Docker</h3>
              <p>{packages["docker-version"]}</p>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <RetinaImage src="cartoon-docker-machine.png"/>
              <h3>Docker Machine</h3>
              <p>{packages["docker-machine-version"]}</p>
            </div>
            <div className="col-md-6">
              <RetinaImage src="cartoon-docker-compose.png"/>
              <h3>Docker Compose</h3>
              <p>{packages["docker-compose-version"]}</p>
            </div>
          </div>
          <h2>Third-Party Software</h2>
          <div className="row">
            <div className="col-md-6 col-md-offset-3">
              <h3>VirtualBox</h3>
              <p>{packages["virtualbox-version"]}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Preferences;
