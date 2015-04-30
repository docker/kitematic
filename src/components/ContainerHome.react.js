var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var ContainerStore = require('../stores/ContainerStore');
var Radial = require('./Radial.react');
var ContainerHomePreview = require('./ContainerHomePreview.react');
var ContainerHomeLogs = require('./ContainerHomeLogs.react');
var ContainerHomeFolders = require('./ContainerHomeFolders.react');
var shell = require('shell');
var ContainerUtil = require('../utils/ContainerUtil');
var util = require('../utils/Util');

var resizeWindow = function () {
  $('.left .wrapper').height(window.innerHeight - 240);
  $('.right .wrapper').height(window.innerHeight / 2 - 100);
};

var ContainerHome = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    return {
      ports: {},
      defaultPort: null,
      progress: 0
    };
  },
  handleResize: function () {
    resizeWindow();
  },
  handleErrorClick: function () {
    shell.openExternal('https://github.com/kitematic/kitematic/issues/new');
  },
  componentWillReceiveProps: function () {
    this.init();
  },
  componentDidMount: function() {
    this.init();
    ContainerStore.on(ContainerStore.SERVER_PROGRESS_EVENT, this.updateProgress);
    resizeWindow();
    window.addEventListener('resize', this.handleResize);
  },
  componentWillUnmount: function() {
    ContainerStore.removeListener(ContainerStore.SERVER_PROGRESS_EVENT, this.updateProgress);
    window.removeEventListener('resize', this.handleResize);
  },
  componentDidUpdate: function () {
    resizeWindow();
  },
  init: function () {
    var container = ContainerStore.container(this.context.router.getCurrentParams().name);
    if (!container) {
      return;
    }
    var ports = ContainerUtil.ports(container);
    this.setState({
      ports: ports,
      defaultPort: _.find(_.keys(ports), function (port) {
        return util.webPorts.indexOf(port) !== -1;
      }),
      progress: ContainerStore.progress(this.context.router.getCurrentParams().name),
      blocked: ContainerStore.blocked(this.context.router.getCurrentParams().name)
    });
  },
  updateProgress: function (name) {
    if (name === this.context.router.getCurrentParams().name) {
      this.setState({
        blocked: ContainerStore.blocked(name),
        progress: ContainerStore.progress(name)
      });
    }
  },
  render: function () {
    var body;
    if (this.props.error) {
      body = (
        <div className="details-progress">
          <h3>An error occurred:</h3>
          <h2>{this.props.error.statusCode} {this.props.error.reason} - {this.props.error.json}</h2>
          <h3>If you feel that this error is invalid, please <a onClick={this.handleErrorClick}>file a ticket on our GitHub repo.</a></h3>
          <Radial progress={100} error={true} thick={true} transparent={true}/>
        </div>
      );
    } else if (this.props.container && this.props.container.State.Downloading) {
      if (this.state.progress !== undefined) {
        if (this.state.progress > 0) {
          body = (
            <div className="details-progress">
              <h2>Downloading Image</h2>
              <Radial progress={Math.min(Math.round(this.state.progress * 100), 99)} thick={true} gray={true}/>
            </div>
          );
        } else {
          body = (
            <div className="details-progress">
              <h2>Downloading Image</h2>
              <Radial spin="true" progress="90" thick={true} transparent={true}/>
            </div>
          );
        }

      } else if (this.state.blocked) {
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
      if (this.state.defaultPort) {
        body = (
          <div className="details-panel home">
            <div className="content">
              <div className="left">
                <ContainerHomePreview />
              </div>
              <div className="right">
                <ContainerHomeLogs container={this.props.container}/>
                <ContainerHomeFolders container={this.props.container} />
              </div>
            </div>
          </div>
        );
      } else {
        var right;
        if (_.keys(this.state.ports) > 0) {
          right = (
            <div className="right">
              <ContainerHomePreview />
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
