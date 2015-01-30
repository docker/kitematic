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
var docker = require('./docker');

var ContainerList = React.createClass({
  render: function () {
    var self = this;
    var containers = this.props.containers.map(function (container) {
      return (
        <ContainerListItem container={container} />
      );
    });
    return (
      <ul>
        {containers}
      </ul>
    );
  }
});

module.exports = ContainerList;
