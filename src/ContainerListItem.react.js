var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var remote = require('remote');
var dialog = remote.require('dialog');
var ContainerStore = require('./ContainerStore');

var ContainerListItem = React.createClass({
  handleItemMouseEnter: function () {
    var $action = $(this.getDOMNode()).find('.action');
    $action.show();
  },
  handleItemMouseLeave: function () {
    var $action = $(this.getDOMNode()).find('.action');
    $action.hide();
  },
  handleDeleteContainer: function () {
    dialog.showMessageBox({
      message: 'Are you sure you want to delete this container?',
      buttons: ['Delete', 'Cancel']
    }, function (index) {
      if (index === 0) {
        ContainerStore.remove(this.props.container.Name, function (err) {
          console.error(err);
          var containers = ContainerStore.sorted();
          if (containers.length === 1) {
            $(document.body).find('.new-container-item').parent().fadeIn();
          }
        });
      }
    }.bind(this));
  },
  render: function () {
    var self = this;
    var container = this.props.container;
    var imageName = container.Config.Image;

    // Synchronize all animations
    var style = {
      WebkitAnimationDelay: (self.props.start - Date.now()) + 'ms'
    };

    var state;
    if (container.State.Downloading) {
      state = <div className="state state-downloading"><div style={style} className="downloading-arrow"></div></div>;
    } else if (container.State.Running && !container.State.Paused) {
      state = <div className="state state-running"><div style={style} className="runningwave"></div></div>;
    } else if (container.State.Restarting) {
      state = <div className="state state-restarting" style={style}></div>;
    } else if (container.State.Paused) {
      state = <div className="state state-paused"></div>;
    } else if (container.State.ExitCode) {
      // state = <div className="state state-error"></div>;
      state = <div className="state state-stopped"></div>;
    } else {
      state = <div className="state state-stopped"></div>;
    }

    return (
      <Router.Link data-container={name} to="containerDetails" params={{name: container.Name}}>
        <li onMouseEnter={self.handleItemMouseEnter} onMouseLeave={self.handleItemMouseLeave}>
          {state}
          <div className="info">
            <div className="name">
              {container.Name}
            </div>
            <div className="image">
              {imageName}
            </div>
          </div>
          <div className="action">
            <span className="icon icon-delete-3 btn-delete" onClick={this.handleDeleteContainer}></span>
          </div>
        </li>
      </Router.Link>
    );
  }
});

module.exports = ContainerListItem;
