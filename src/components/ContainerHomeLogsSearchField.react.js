import $ from 'jquery';
import React from 'react/addons';
import Router from 'react-router';
import logActions from '../actions/LogActions';
import Convert from 'ansi-to-html';

module.exports = React.createClass({

  focus: function() {
    this.refs.searchField.getDOMNode().focus(); 
  },

  componentDidMount: function() {
    this.focus();
  },

  componentWillUnmount: function() {
    logActions.search.defer('');
  },

  handleChange: function(e) {
    logActions.search(e.target.value);
  },

  render: function () {
    return (
      <div className="logs-search-field">
        <div className="logs-search-text">
          <div className="logs-search-prompt">find:</div>
          <input type="search" ref="searchField" className="logs-search-query" onChange={this.handleChange} />
        </div>
      </div>
    );
  }
});
