var React = require('react/addons');
var ContainerListItem = require('./ContainerListItem.react');
var ContainerListNewItem = require('./ContainerListNewItem.react');

var ContainerList = React.createClass({
  componentWillMount: function () {
    this._start = Date.now();
  },
  render: function () {
    var self = this;
    var containers = this.props.containers.map(function (container) {
      var containerId = container.Id;
      if (!containerId && container.State.Downloading) {
        // Fall back to the container image name when there is no id. (when the
        // image is downloading).
        containerId = container.Image;
      }
      return (
        <ContainerListItem key={containerId} container={container} start={self._start} />
      );
    });
    var newItem;
    if (!this.props.downloading) {
      newItem = <ContainerListNewItem key={'newcontainer'} containers={this.props.containers} />;
    } else {
      newItem = '';
    }
    return (
      <ul>
        {newItem}
        {containers}
      </ul>
    );
  }
});

module.exports = ContainerList;
