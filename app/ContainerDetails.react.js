var _ = require('underscore');
var React = require('react');
var Router = require('react-router');
var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;
var Convert = require('ansi-to-html');
var convert = new Convert();
var ContainerStore = require('./ContainerStore');
var docker = require('./docker');

var ContainerDetails = React.createClass({
  mixins: [Router.State],
  getInitialState: function () {
    return {
      logs: []
    };
  },
  componentWillReceiveProps: function () {
    console.log('props');
    this.update();
    var self = this;
    var logs = [];
    var index = 0;
    docker.client().getContainer(this.getParams().name).logs({
      follow: false,
      stdout: true,
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
    });
  },
  componentWillMount: function () {
    this.update();
  },
  componentDidMount: function () {
    ContainerStore.addChangeListener(ContainerStore.CONTAINERS, this.update);
    ContainerStore.addChangeListener(ContainerStore.PROGRESS, this.update);
  },
  componentWillUnmount: function () {
    ContainerStore.removeChangeListener(ContainerStore.CONTAINERS, this.update);
    ContainerStore.removeChangeListener(ContainerStore.PROGRESS, this.update);
  },
  update: function () {
    var name = this.getParams().name;
    var container = ContainerStore.container(name);
    var progress = ContainerStore.progress(name);
    this.setState({
      progress: progress,
      container: container
    });
  },
  _escapeHTML: function (html) {
    var text = document.createTextNode(html);
    var div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML;
  },
  render: function () {
    console.log('render details');
    var self = this;

    if (!this.state) {
      return <div></div>;
    }

    var logs = this.state.logs.map(function (l, i) {
      return <p key={i} dangerouslySetInnerHTML={{__html: l}}></p>;
    });

    if (!this.state.container) {
      return false;
    }

    var state;
    if (this.state.container.State.Running) {
      state = <h2 className="status">running</h2>;
    } else if (this.state.container.State.Restarting) {
      state = <h2 className="status">restarting</h2>;
    }

    return (
      <div className="details">
        <div className="details-header">
          <h1>{this.state.container.Name.replace('/', '')}</h1>
          <h2>{this.state.progress}</h2>
        </div>
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
