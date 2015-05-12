var $ = require('jquery');
var React = require('react/addons');
var LogStore = require('../stores/LogStore');
var Router = require('react-router');
var metrics = require('../utils/MetricsUtil');

var _prevBottom = 0;

module.exports = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      logs: []
    };
  },
  componentDidMount: function() {
    if (!this.props.container) {
      return;
    }
    this.update();
    this.scrollToBottom();
    LogStore.on(LogStore.SERVER_LOGS_EVENT, this.update);
    LogStore.fetch(this.props.container.Name);
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.container && nextProps.container && this.props.container.Name !== nextProps.container.Name) {
      LogStore.detach(this.props.container.Name);
      LogStore.fetch(nextProps.container.Name);
    }
  },

  componentWillUnmount: function() {
    if (!this.props.container) {
      return;
    }

    LogStore.detach(this.props.container.Name);
    LogStore.removeListener(LogStore.SERVER_LOGS_EVENT, this.update);
  },
  componentDidUpdate: function () {
    this.scrollToBottom();
  },
  scrollToBottom: function () {
    var parent = $('.logs');
    if (parent.scrollTop() >= _prevBottom - 50) {
      parent.scrollTop(parent[0].scrollHeight - parent.height());
    }
    _prevBottom = parent[0].scrollHeight - parent.height();
  },
  handleClickLogs: function () {
    metrics.track('Viewed Logs', {
      from: 'preview'
    });
    this.context.router.transitionTo('containerLogs', {name: this.props.container.Name});
  },
  update: function () {
    if (!this.props.container) {
      return;
    }
    this.setState({
      logs: LogStore.logs(this.props.container.Name)
    });
  },
  render: function () {
    var logs = this.state.logs.map(function (l, i) {
      return <span key={i} dangerouslySetInnerHTML={{__html: l}}></span>;
    });
    if (logs.length === 0) {
      logs = "No logs for this container.";
    }
    return (
      <div className="mini-logs wrapper">
        <h4>Logs</h4>
        <div className="widget">
          <div className="logs">
            {logs}
          </div>
          <div className="mini-logs-overlay" onClick={this.handleClickLogs}><span className="icon icon-scale-spread-1"></span><div className="text">View Logs</div></div> </div>
      </div>
    );
  }
});
