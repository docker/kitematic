var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var ContainerStore = require('../stores/ContainerStore');
var metrics = require('../Metrics');

var ContainerListNewItem = React.createClass({
  handleItemMouseEnter: function () {
    var $action = $(this.getDOMNode()).find('.action');
    $action.show();
  },
  handleItemMouseLeave: function () {
    var $action = $(this.getDOMNode()).find('.action');
    $action.hide();
  },
  handleDelete: function () {
    var self = this;
    metrics.track('Deleted Container', {
      from: 'list',
      type: 'new'
    });
    var containers = ContainerStore.sorted();
    $(self.getDOMNode()).fadeOut(300, function () {
      if (containers.length > 0) {
        var name = containers[0].Name;
        self.transitionTo('containerHome', {name: name});
      }
    });
  },
  render: function () {
    var self = this;
    var action;
    if (this.props.containers.length > 0) {
      action = (
        <div className="action">
          <span className="icon icon-delete-3 btn-delete" onClick={this.handleDelete}></span>
        </div>
      );
    }
    return (
      <Router.Link to="new">
        <li className="new-container-item" onMouseEnter={self.handleItemMouseEnter} onMouseLeave={self.handleItemMouseLeave}>
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
