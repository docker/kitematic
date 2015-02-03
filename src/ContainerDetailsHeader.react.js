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

var ContainerDetailsHeader = React.createClass({
  render: function () {
    var state;
    if (this.props.container.State.Running) {
      state = <span className="status running">RUNNING</span>;
    } else if (this.props.container.State.Restarting) {
      state = <span className="status restarting">RESTARTING</span>;
    } else if (this.props.container.State.Paused) {
      state = <span className="status paused">PAUSED</span>;
    } else if (this.props.container.State.Downloading) {
      state = <span className="status downloading">DOWNLOADING</span>;
    } else {
      state = <span className="status stopped">STOPPED</span>;
    }
    return (
      <div className="details-header">
        <h1>{this.props.container.Name}</h1>{state}
      </div>
    );
  }
});

module.exports = ContainerDetailsHeader;
