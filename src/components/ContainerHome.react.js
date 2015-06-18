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
    $('.full .wrapper').height(window.innerHeight - 132);
    $('.left .wrapper').height(window.innerHeight - 132);
    $('.right .wrapper').height(window.innerHeight / 2 - 55);
  },

  handleErrorClick: function () {
    shell.openExternal('https://github.com/kitematic/kitematic/issues/new');
  },

  showWeb: function () {
    return _.keys(this.props.ports).length > 0;
  },
  
  showFolders: function () {
    return this.props.container.Volumes && _.keys(this.props.container.Volumes).length > 0 && this.props.container.State.Running;
  },
  
  render: function () {
    if (!this.props.container) {
      return;
    }

    let body;
    if (this.props.container.Error) {
      body = (
        <div className="details-progress error">
          <h2>We&#39;re sorry. There seem to be an error:</h2>
          <p className="error-message">{this.props.container.Error}</p>
          <p>If this error is invalid, please file a ticket on our Github repo.</p>
          <a className="btn btn-action" onClick={this.handleErrorClick}>File Ticket</a>
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
      var logWidget = (
        <ContainerHomeLogs container={this.props.container}/>
      );
      var webWidget;
      if (this.showWeb()) {
        webWidget = (
          <ContainerHomePreview ports={this.props.ports} defaultPort={this.props.defaultPort} />
        );
      }
      var folderWidget;
      if (this.showFolders()) {
        folderWidget = (
          <ContainerHomeFolders container={this.props.container} />
        );
      }
      if (logWidget && !webWidget && !folderWidget) {
        body = (
          <div className="details-panel home">
            <div className="content">
              <div className="full">
                {logWidget}
              </div>
            </div>
          </div>
        );
      } else {
        body = (
          <div className="details-panel home">
            <div className="content">
              <div className="left">
                {logWidget}
              </div>
              <div className="right">
                {webWidget}
                {folderWidget}
              </div>
            </div>
          </div>
        );
      }
    }
    return body;
  }
});

module.exports = ContainerHome;
