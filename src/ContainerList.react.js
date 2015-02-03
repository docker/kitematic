var React = require('react/addons');
var ContainerListItem = require('./ContainerListItem.react');

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
        {containers}
      </ul>
    );
  }
});

module.exports = ContainerList;
