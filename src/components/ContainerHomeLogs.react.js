import $ from 'jquery';
import React from 'react/addons';
import LogStore from '../stores/LogStore';
import Router from 'react-router';
import metrics from '../utils/MetricsUtil';

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
    if (parent[0].scrollHeight - parent.height() >= _prevBottom - 50) {
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
      return  <span key={i} dangerouslySetInnerHTML={{__html: l}}></span>;
    });
    if (logs.length === 0) {
      logs = "No logs for this container.";
    }
    return (
      <div className="mini-logs wrapper">
        <div className="widget">
          <div className="top-bar">
            <div className="text">Container Logs</div>
          </div>
          <div className="logs">
            {logs}
          </div>
        </div>
      </div>
    );
  }
});
