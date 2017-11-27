import $ from 'jquery';
import React from 'react/addons';
import Router from 'react-router';
import containerActions from '../actions/ContainerActions';
import Convert from 'ansi-to-html';
import logActions from '../actions/LogActions';
import logStore from '../stores/LogStore';
import ContainerHomeLogsSearchField from './ContainerHomeLogsSearchField.react';

let escape = function (html) {
  var text = document.createTextNode(html);
  var div = document.createElement('div');
  div.appendChild(text);
  return div.innerHTML;
};

let convert = new Convert();
let prevBottom = 0;

module.exports = React.createClass({
  getInitialState: function() {
    return {
      lineNum: 0,
      currentHighlighted: 1,
      searchText: '',
      searchFieldVisible: false
    };
  },

  scrollToEnd: function() {
    const node = $('.logs').get()[0];
    node.scrollTop = node.scrollHeight;
  },

  scrollHighlightIntoView: function() {
    const node = $('.logs').get()[0];
    const $highlight = $('.highlight');
    if ($highlight.length > 0) {
      const topBarHeight = 40;
      const searchFieldHeight = 20;

      const min = node.scrollTop + topBarHeight;
      const max = node.scrollTop + node.clientHeight - searchFieldHeight;
      const pos = $highlight.get()[0].offsetTop;

      if (pos < min) {
        node.scrollTop = pos - topBarHeight;
      } else if (pos > max) {
        node.scrollTop = pos - node.clientHeight + searchFieldHeight;
      }
    }
  },

  componentDidUpdate: function () {
    if (this.props.container.Logs && this.props.container.Logs.length != this.state.lineNum) {
      this.scrollToEnd();
      this.setState({lineNum: this.props.container.Logs.length});
    }

    this.scrollHighlightIntoView();
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.container && nextProps.container && this.props.container.Name !== nextProps.container.Name) {
      containerActions.active(nextProps.container.Name);
    }
  },

  componentDidMount: function () {
    containerActions.active(this.props.container.Name);
    document.addEventListener('keydown', this.handleKeyDown);
    logStore.listen(this.update);
  },

  componentWillUnmount: function () {
    containerActions.active(null);
    document.removeEventListener('keydown', this.handleKeyDown);
    logStore.unlisten(this.update);
  },

  update: function(store) {
    this.setState(store);
  },

  handleKeyDown: function(event) {
    // cmd or ctrl + F
    if ((event.metaKey || event.ctrlKey) && event.keyCode == 70) {
      this.state.searchFieldVisible ? this.refs.searchField.focus() : logActions.toggleSearchField(true);
    }

    // esc
    if (event.keyCode == 27 && this.state.searchFieldVisible) {
      logActions.highlight(1);
      logActions.toggleSearchField(false);
    }

    // Enter
    if (event.keyCode == 13) {
      const $marks = $('mark');
      const nextHighlightPositionCand = this.state.currentHighlighted + (event.shiftKey ? -1 : 1);
      const nextHighlightPosition = (nextHighlightPositionCand < 1 ? $marks.length : (nextHighlightPositionCand > $marks.length ? 1 : nextHighlightPositionCand));
      logActions.highlight(nextHighlightPosition);
    }
  },

  escapeAndHighlightLogs: function() {
    const highlight = (line) => line.replace(RegExp(this.state.searchText, 'i') || null, '<mark>$&</mark>');
    const markRegExp = RegExp(`((?!<mark)[\\s\\S]*?(<mark)){${this.state.currentHighlighted}}`);

    const highlightedLog = this.props.container.Logs.map((l, idx) => highlight(escape(l.substr(l.indexOf(' ')+1))).replace(/ /g, '&nbsp;<wbr>')).join('\n');
    const highlightedLogs = highlightedLog.replace(markRegExp, "$& class='highlight'").split('\n');

    return (
      highlightedLogs.map((l, idx) => <div key={`${this.props.container.Name}-${idx}`} dangerouslySetInnerHTML={{__html: convert.toHtml(l)}}></div>)
    );
  },

  render: function () {
    const logs = this.props.container.Logs ? this.escapeAndHighlightLogs() : ['0 No logs for this container.'];

    const searchField = this.state.searchFieldVisible ? <ContainerHomeLogsSearchField ref="searchField"></ContainerHomeLogsSearchField> : '';

    return (
      <div className="mini-logs wrapper">
        <div className="widget">
          <div className="top-bar">
            <div className="text">Container Logs</div>
          </div>
          <div className="logs">
            {logs}
          </div>
          {searchField}
        </div>
      </div>
    );
  }
});