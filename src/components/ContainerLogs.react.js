import $ from 'jquery';
import React from 'react/addons';
import LogStore from '../stores/LogStore';

var _prevBottom = 0;

module.exports = React.createClass({
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
    var parent = $('.details-logs');
    if (parent.scrollTop() >= _prevBottom - 50) {
      parent.scrollTop(parent[0].scrollHeight - parent.height());
    }
    _prevBottom = parent[0].scrollHeight - parent.height();
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
      <div className="details-panel details-logs logs">
        {logs}
      </div>
    );
  }
});
