var React = require('react/addons');
var ContainerListItem = require('./ContainerListItem.react');

var ContainerList = React.createClass({
  componentWillMount: function () {
    this.start = Date.now();
  },
  render: function () {
    var containers = this.props.containers.map(container => {
      return (
        <ContainerListItem key={container.Id} container={container} start={this.start} />
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
