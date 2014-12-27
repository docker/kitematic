/** @jsx React.DOM */
var App = require('./App.js');

var React = require('react');
window.React = React; // export for dev tools

React.render(<App/>, document.body);
