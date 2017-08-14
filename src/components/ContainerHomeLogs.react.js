import $ from 'jquery';
import React from 'react/addons';
import Router from 'react-router';
import containerActions from '../actions/ContainerActions';
import Convert from 'ansi-to-html';
import Promise from 'bluebird';

let escape = function (html) {
  var text = document.createTextNode(html);
  var div = document.createElement('div');
  div.appendChild(text);
  return div.innerHTML;
};

let convert = new Convert();
let prevBottom = 0;

var _searchPromise = null;
module.exports = React.createClass({

  componentDidUpdate: function () {
    var node = $('.logs').get()[0];
    node.scrollTop = node.scrollHeight;
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.container && nextProps.container && this.props.container.Name !== nextProps.container.Name) {
      containerActions.active(nextProps.container.Name);
    }
    this.setState({ logs: this.props.container.Logs, logCount: this.props.container.Logs.length || 0 });
  },

  componentDidMount: function () {
    containerActions.active(this.props.container.Name);
  },

  componentWillUnmount: function () {
    containerActions.active(null);
    if (_searchPromise) {
      _searchPromise.cancel();
    }
  },

  getInitialState: function () {
    let logs = this.props.container.Logs || [];
    return { filterText: '', logs: logs, logCount: 0 };
  },

  getLogCategoryClass: function ( log ) {
    if ( !log ) {
      return '';
    }
    log = log.toLowerCase();
    let logCategoryClass;
    if ( log.includes('fatal') ) {
      logCategoryClass = 'fatal';
    }else if ( log.includes('err') ) {
      logCategoryClass = 'error';
    } else if ( log.includes('warn') ) {
      logCategoryClass = 'warn';
    } else if ( log.includes('inf') ) {
      logCategoryClass = 'info';
    } else if ( log.includes('debug') ) {
      logCategoryClass = 'debug';
    } else if ( log.includes('trace') ) {
      logCategoryClass = 'trace';
    } else {
      logCategoryClass = '';
    }
    return logCategoryClass;
  },
  handleDeleteFilter: function () {
    if ( this.state.filter === '' ) {
      return;
    }
    this.setState({
      filterText: ''
    });
    this.refs.filterInput.getDOMNode().value = '';
  },
  handleFilterChange: function (e) {
    let val = e.target.value, self = this;
    if ( val === this.state.filterText ) {
      return;
    }
    if ( _searchPromise ) {
      _searchPromise.cancel();
      _searchPromise = null;
    }
    _searchPromise = Promise.delay(500).cancellable().then(() => {
      self.setState({
        filterText: val
      });
    }).catch(Promise.CancellationError, () => {});
  },

  render: function () {
    let logs = this.state.logs.length ? this.state.logs.filter(log => log.includes( this.state.filterText )).map((l, index) => {
      const key = `${this.props.container.Name}-${index}`;
      const categoryClass = this.getLogCategoryClass( l );
      return <div className={categoryClass} key={key} dangerouslySetInnerHTML={{__html: convert.toHtml(escape(l.substr(l.indexOf(' ') + 1)).replace(/ /g, '&nbsp;<wbr>'))}}></div>;
    }) : ['0 No logs for this container.'];

    return (
      <div className="mini-logs wrapper">
        <div className="widget">
          <div className="top-bar">
            <div className="text">Container Logs</div>
              {this.state.logCount > 50 &&
                <div className="filter-wrapper" >
                  <input ref="filterInput" type="text" className="input-filter" id="filter"
                    onChange={this.handleFilterChange} placeholder="Enter text for filter"/>
                  <span className="btn circular" onClick={this.handleDeleteFilter}>
                    <span className="icon icon-delete"></span>
                  </span>
                </div>
              }
          </div>
          <div className="logs">
            {logs}
          </div>
        </div>
      </div>
    );
  }
});
