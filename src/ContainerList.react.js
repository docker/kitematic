var React = require('react/addons');
var ContainerListItem = require('./ContainerListItem.react');
var ContainerListNewItem = require('./ContainerListNewItem.react');

var ContainerList = React.createClass({
  render: function () {
    var containers = this.props.containers.map(function (container) {
      console.log(container);
      return (
        <ContainerListItem container={container} />
      );
    });
    return (
      <ul>
        <ContainerListNewItem containers={this.props.containers} />
        {containers}
      </ul>
    );
  }
});

module.exports = ContainerList;
