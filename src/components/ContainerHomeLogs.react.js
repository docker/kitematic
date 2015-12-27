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

  getLogFontSize: function(offset) {
    var fontSize = parseInt($('.logs').css('font-size')) + offset;
    return (fontSize < 8 ? 8 : fontSize);
  },

  increaseLogFontSize: function() {
    var fontSize = this.getLogFontSize(2);
    $('.logs').css("font-size", fontSize);
  },

  decreaseLogFontSize: function() {
    var fontSize = this.getLogFontSize(-2);
    $('.logs').css("font-size", fontSize);
  },

  render: function () {
    let logs = this.props.container.Logs ?
        this.props.container.Logs.map((l) => <div key={l.substr(0,l.indexOf(' '))} dangerouslySetInnerHTML={{__html: convert.toHtml(escape(l.substr(l.indexOf(' ')+1)).replace(/ /g, '&nbsp;<wbr>'))}}></div>) :
        ['0 No logs for this container.'];
    return (
      <div className="mini-logs wrapper">
        <div className="widget">
          <div className="top-bar">
            <div className="text">
              Container Logs
            </div>
            <span className="fontSizeSettings">
              <span className="text increaseFontSize" onClick= {this.increaseLogFontSize}>+</span>
              <span className="text decreaseFontSize" onClick= {this.decreaseLogFontSize}>-</span>
            </span>
          </div>
          <div className="logs">
            {logs}
          </div>
        </div>
      </div>
    );
  }
});
