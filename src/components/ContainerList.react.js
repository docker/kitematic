var React = require('react/addons');
var ContainerListItem = require('./ContainerListItem.react');
var ContainerListNewItem = require('./ContainerListNewItem.react');

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
        <ContainerListNewItem key={'newcontainer'} containers={this.props.containers}/>
        {containers}
      </ul>
    );
  }
});

module.exports = ContainerList;
