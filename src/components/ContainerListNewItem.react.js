var $ = require('jquery');
var React = require('react');
var Router = require('react-router');
var metrics = require('../utils/MetricsUtil');

var ContainerListNewItem = React.createClass({
  mixins: [Router.Navigation, Router.State],
  handleItemMouseEnter: function () {
    var $action = $(this.getDOMNode()).find('.action');
    $action.show();
  },
  handleItemMouseLeave: function () {
    var $action = $(this.getDOMNode()).find('.action');
    $action.hide();
  },
  handleDelete: function (event) {
    metrics.track('Deleted Container', {
      from: 'list',
      type: 'new'
    });

    if (this.props.containers.length > 0 && this.getRoutes()[this.getRoutes().length - 2].name === 'new') {
      var name = this.props.containers[0].Name;
      this.transitionTo('containerHome', {name});
    }
    $(this.getDOMNode()).fadeOut(300);
    event.preventDefault();
  },
  render: function () {
    var action;
    if (this.props.containers.length > 0) {
      action = (
        <div className="action">
          <span className="icon icon-delete-3 btn-delete" onClick={this.handleDelete}></span>
        </div>
      );
    }
    return (
      <Router.Link to="search">
        <li className="new-container-item" onMouseEnter={this.handleItemMouseEnter} onMouseLeave={this.handleItemMouseLeave}>
          <div className="state state-new"></div>
          <div className="info">
            <div className="name">
              New Container
            </div>
          </div>
          {action}
        </li>
      </Router.Link>
    );
  }
});

module.exports = ContainerListNewItem;
