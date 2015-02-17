var $ = require('jquery');
var React = require('react/addons');
var LogStore = require('./LogStore');
var Router = require('react-router');

var _oldScrollTop = 0;

var ContainerHomeLogs = React.createClass({
  mixins: [Router.State, Router.Navigation],
  getInitialState: function () {
    return {
      logs: []
    };
  },
  componentWillReceiveProps: function () {
    this.init();
  },
  componentDidMount: function() {
    this.init();
    LogStore.on(LogStore.SERVER_LOGS_EVENT, this.updateLogs);
  },
  componentWillUnmount: function() {
    LogStore.removeListener(LogStore.SERVER_LOGS_EVENT, this.updateLogs);
  },
  componentDidUpdate: function () {
    // Scroll logs to bottom
    var parent = $('.logs');
    if (parent.scrollTop() >= _oldScrollTop) {
      parent.scrollTop(parent[0].scrollHeight - parent.height());
    }
    _oldScrollTop = parent.scrollTop();
  },
  init: function () {
    this.updateLogs();
  },
  updateLogs: function (name) {
    if (name && name !== this.getParams().name) {
      return;
    }
    this.setState({
      logs: LogStore.logs(this.getParams().name)
    });
  },
  handleClickLogs: function () {
    this.transitionTo('containerLogs', {name: this.getParams().name});
  },
  render: function () {
    var logs = this.state.logs.map(function (l, i) {
      return <p key={i} dangerouslySetInnerHTML={{__html: l}}></p>;
    });
    return (
      <div className="mini-logs wrapper">
        <h4>Logs</h4>
        <div className="widget">
          <div className="logs">
            {logs}
          </div>
          <div className="mini-logs-overlay" onClick={this.handleClickLogs}><span className="icon icon-scale-spread-1"></span><div className="text">View Logs</div></div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerHomeLogs;
