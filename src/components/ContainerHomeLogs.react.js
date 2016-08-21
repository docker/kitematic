import $ from 'jquery';
import React from 'react/addons';
import Router from 'react-router';
import containerActions from '../actions/ContainerActions';
import Convert from 'ansi-to-html';

let escape = function (html) {
  var text = document.createTextNode(html);
  var div = document.createElement('div');
  div.appendChild(text);
  return div.innerHTML;
};

let convert = new Convert();
let prevBottom = 0;

module.exports = React.createClass({

  componentDidUpdate: function () {
    var node = $('.logs').get()[0];
    node.scrollTop = node.scrollHeight;
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.container && nextProps.container && this.props.container.Name !== nextProps.container.Name) {
      containerActions.active(nextProps.container.Name);
    }
  },

  componentDidMount: function () {
    containerActions.active(this.props.container.Name);
  },

  componentWillUnmount: function () {
    containerActions.active(null);
  },

  render: function () {
    let logs = this.props.container.Logs ? this.props.container.Logs.map((l, index) => {
        const key = `${this.props.container.Name}-${index}`;
        return <div key={key} dangerouslySetInnerHTML={{__html: convert.toHtml(escape(l.substr(l.indexOf(' ')+1)).replace(/ /g, '&nbsp;<wbr>'))}}></div>;
      }) : ['0 No logs for this container.'];

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
