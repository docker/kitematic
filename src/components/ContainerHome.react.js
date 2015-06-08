var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var Radial = require('./Radial.react');
var ContainerProgress = require('./ContainerProgress.react');
var ContainerHomePreview = require('./ContainerHomePreview.react');
var ContainerHomeLogs = require('./ContainerHomeLogs.react');
var ContainerHomeFolders = require('./ContainerHomeFolders.react');
var shell = require('shell');

var ContainerHome = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  componentDidMount: function() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  },

  componentWillUnmount: function() {
    window.removeEventListener('resize', this.handleResize);
  },

  componentDidUpdate: function () {
    this.handleResize();
  },

  handleResize: function () {
    $('.left .wrapper').height(window.innerHeight - 105);
    $('.right .wrapper').height(window.innerHeight / 2 - 100);
  },

  handleErrorClick: function () {
    shell.openExternal('https://github.com/kitematic/kitematic/issues/new');
  },

  render: function () {
    if (!this.props.container) {
      return;
    }

    let body;
    if (this.props.container.Error) {
      body = (
        <div className="details-progress">
          <h3>An error occurred:</h3>
          <h2>{this.props.container.Error.message}</h2>
          <h3>If you feel that this error is invalid, please <a onClick={this.handleErrorClick}>file a ticket on our GitHub repo.</a></h3>
          <Radial progress={100} error={true} thick={true} transparent={true}/>
        </div>
      );
    } else if (this.props.container && this.props.container.State.Downloading) {
      if (this.props.container.Progress) {
        let values = [];
        let sum = 0.0;

        for (let i = 0; i < this.props.container.Progress.amount; i++) {
          values.push(Math.round(this.props.container.Progress.progress[i].value));
          sum += this.props.container.Progress.progress[i].value;
        }

        sum = sum / this.props.container.Progress.amount;

        body = (
          <div className="details-progress">
            <h2>Downloading Image</h2>
            <h2>{(Math.round(sum*100)/100).toFixed(2)}%</h2>
            <div className="container-progress-wrapper">
              <ContainerProgress pBar1={values[0]} pBar2={values[1]} pBar3={values[2]} pBar4={values[3]}/>
            </div>
          </div>
        );

      } else if (this.props.container.State.Waiting) {
        body = (
          <div className="details-progress">
            <h2>Waiting For Another Download</h2>
            <Radial spin="true" progress="90" thick={true} transparent={true}/>
          </div>
        );
      } else {
        body = (
          <div className="details-progress">
            <h2>Connecting to Docker Hub</h2>
            <Radial spin="true" progress="90" thick={true} transparent={true}/>
          </div>
        );
      }
    } else {
      if (this.props.defaultPort) {
        body = (
          <div className="details-panel home">
            <div className="content">
              <div className="left">
                <ContainerHomeLogs container={this.props.container}/>
              </div>
              <div className="right">
                <ContainerHomePreview ports={this.props.ports} defaultPort={this.props.defaultPort} />
                <ContainerHomeFolders container={this.props.container} />
              </div>
            </div>
          </div>
        );
      } else {
        var right;
        if (_.keys(this.props.ports) > 0) {
          right = (
            <div className="right">
              <ContainerHomePreview  ports={this.props.ports} defaultPort={this.props.defaultPort} />
              <ContainerHomeFolders container={this.props.container} />
            </div>
          );
        } else {
          right = (
            <div className="right">
              <ContainerHomeFolders container={this.props.container} />
            </div>
          );
        }
        body = (
          <div className="details-panel home">
            <div className="content">
              <div className="left">
                <ContainerHomeLogs container={this.props.container}/>
              </div>
              {right}
            </div>
          </div>
        );
      }
    }
    return body;
  }
});

module.exports = ContainerHome;
