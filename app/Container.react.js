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

var docker = require('./docker.js');

var Container = React.createClass({
  mixins: [Router.State],
  componentWillReceiveProps: function () {
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
          logs.push(convert.toHtml(msg));
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
              logs.push(convert.toHtml(msg));
              self.setState({logs: logs});
            }
            index += 1;
          });
        });
      });
    });
  },
  render: function () {
    var self = this;

    if (!this.state || !this.state.logs) {
      return false;
    }

    var container = _.find(this.props.containers, function (container) {
      return container.Id === self.getParams().Id;
    });
    // console.log(container);

    if (!container || !this.state) {
      return <div></div>;
    }

    var logs = this.state.logs.map(function (l, i) {
      return <p key={i} dangerouslySetInnerHTML={{__html: l}}></p>;
    });

    var state;
    if (container.State.Running) {
      state = <h2 className="status">running</h2>;
    } else if (container.State.Restarting) {
      state = <h2 className="status">restarting</h2>;
    }

    return (
      <div>
        <div className="details-header">
        <h1>{container.Name.replace('/', '')}</h1>{state}
        </div>
        <div className="logs">
          {logs}
        </div>
      </div>
    );
  }
});

module.exports = Container;
