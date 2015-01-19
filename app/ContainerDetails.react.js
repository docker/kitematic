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
var ContainerStore = require('./ContainerStore.js');
var docker = require('./docker.js');

var ContainerDetails = React.createClass({
  mixins: [Router.State],
  getInitialState: function () {
    return {
      logs: []
    };
  },
  componentWillMount: function () {
    this.update();
    var self = this;
    var logs = [];
    var index = 0;
    docker.client().getContainer(this.getParams().Id).logs({
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
        docker.client().getContainer(self.getParams().Id).logs({
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
  componentDidMount: function () {
    ContainerStore.addChangeListener(this.update);
  },
  componentWillUnmount: function () {
    ContainerStore.removeChangeListener(this.update);
  },
  update: function () {
    var containerId = this.getParams().Id;
    this.setState({
      container: ContainerStore.containers()[containerId]
    });
  },
  _escapeHTML: function (html) {
    var text = document.createTextNode(html);
    var div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML;
  },
  render: function () {
    var self = this;

    if (!this.state) {
      return <div></div>;
    }

    var logs = this.state.logs.map(function (l, i) {
      return <p key={i} dangerouslySetInnerHTML={{__html: l}}></p>;
    });

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
