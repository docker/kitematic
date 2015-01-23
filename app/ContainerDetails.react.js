var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var Convert = require('ansi-to-html');
var convert = new Convert();
var ContainerStore = require('./ContainerStore');
var docker = require('./docker');
var exec = require('exec');
var boot2docker = require('./boot2docker');
var ProgressBar = require('react-bootstrap/ProgressBar');

var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

var ContainerDetails = React.createClass({
  mixins: [Router.State],
  _oldHeight: 0,
  getInitialState: function () {
    return {
      logs: []
    };
  },
  logs: function () {
    this.updateProgress(this.getParams().name);
    /*var self = this;
    var logs = [];
    var index = 0;
    docker.client().getContainer(this.getParams().name).logs({
      follow: false,
      stdout: true,
      stderr: true,
      timestamps: true
    }, function (err, stream) {
      stream.setEncoding('utf8');
      stream.on('data', function (buf) {
        // Every other message is a header
        if (index % 2 === 1) {
          var time = buf.substr(0,buf.indexOf(' '));
          var msg = buf.substr(buf.indexOf(' ')+1);
          logs.push(convert.toHtml(self._escapeHTML(msg)));
        }
        index += 1;
      });
      stream.on('end', function (buf) {
        self.setState({logs: logs});
        docker.client().getContainer(self.getParams().name).logs({
          follow: true,
          stdout: true,
          stderr: true,
          timestamps: true,
          tail: 0
        }, function (err, stream) {
          stream.setEncoding('utf8');
          stream.on('data', function (buf) {
            // Every other message is a header
            if (index % 2 === 1) {
              var time = buf.substr(0,buf.indexOf(' '));
              var msg = buf.substr(buf.indexOf(' ')+1);
              logs.push(convert.toHtml(self._escapeHTML(msg)));
              self.setState({logs: logs});
            }
            index += 1;
          });
        });
      });
    });*/
  },
  componentWillReceiveProps: function () {
    this.logs();
  },
  componentWillMount: function () {
    this.logs();
  },
  componentDidMount: function () {
    ContainerStore.on(ContainerStore.SERVER_PROGRESS_EVENT, this.updateProgress);
  },
  componentWillUnmount: function () {
    ContainerStore.removeListener(ContainerStore.SERVER_PROGRESS_EVENT, this.updateProgress);
  },
  componentDidUpdate: function () {
    var parent = $('.details-logs');
    if (!parent.length) {
      return;
    }
    if (parent.scrollTop() >= this._oldHeight) {
      parent.stop();
      parent.scrollTop(parent[0].scrollHeight - parent.height());
    }
    this._oldHeight = parent[0].scrollHeight - parent.height();
  },
  updateProgress: function (name) {
    if (name === this.getParams().name) {
      this.setState({
        progress: ContainerStore.progress(name)
      });
    }
  },
  _escapeHTML: function (html) {
    var text = document.createTextNode(html);
    var div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML;
  },
  handleClick: function (name) {
    var container = this.props.container;
    boot2docker.ip(function (err, ip) {
      var ports = _.map(container.NetworkSettings.Ports, function (value, key) {
        var portProtocolPair = key.split('/');
        var res = {
          'port': portProtocolPair[0],
          'protocol': portProtocolPair[1]
        };
        if (value && value.length) {
          var port = value[0].HostPort;
          res.host = ip;
          res.port = port;
          res.url = 'http://' + ip + ':' + port;
        } else {
          return null;
        }
        return res;
      });
      exec(['open', ports[0].url], function (err) {
        if (err) { throw err; }
      });
    });
  },
  render: function () {
    var self = this;

    if (!this.state) {
      return <div></div>;
    }

    var logs = this.state.logs.map(function (l, i) {
      return <p key={i} dangerouslySetInnerHTML={{__html: l}}></p>;
    });

    if (!this.props.container) {
      return false;
    }

    var state;
    if (this.props.container.State.Running) {
      state = <h2 className="status">running</h2>;
    } else if (this.props.container.State.Restarting) {
      state = <h2 className="status">restarting</h2>;
    }

    var progress;
    if (this.state.progress > 0 && this.state.progress != 1) {
      progress = (
        <div className="details-progress">
          <ProgressBar now={this.state.progress * 100} label="%(percent)s%" />
        </div>
      );
    } else {
      progress = <div></div>;
    }

    var button;
    if (this.state.progress === 1) {
      button = <a className="btn btn-primary" onClick={this.handleClick}>View</a>;
    } else {
      button = <a className="btn btn-primary disabled" onClick={this.handleClick}>View</a>;
    }

    return (
      <div className="details">
        <div className="details-header">
          <h1>{this.getParams().name}</h1> <a className="btn btn-primary" onClick={this.handleClick}>View</a>
        </div>
        {progress}
        <div className="details-logs">
          <div className="logs">
            {logs}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerDetails;
