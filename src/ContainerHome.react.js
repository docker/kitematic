var async = require('async');
var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var Modal = require('react-bootstrap/Modal');
var RetinaImage = require('react-retina-image');
var ModalTrigger = require('react-bootstrap/ModalTrigger');
var ContainerModal = require('./ContainerModal.react');
var ContainerListItem = require('./ContainerListItem.react');
var Header = require('./Header.react');
var docker = require('./Docker');

var ContainerHome = React.createClass({
  render: function () {
    /*var preview;
    if (this.state.defaultPort) {
      preview = (
        <iframe src={this.state.ports[this.state.defaultPort].url} autosize="on"></iframe>
      );
    }*/
    return (
      <div className="details-panel">
        <h1>HOME</h1>
      </div>
    );
  }
});

module.exports = ContainerHome;
