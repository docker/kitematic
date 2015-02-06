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
      return (
        <ContainerListItem key={container.Id} container={container} start={self._start}/>
      );
    });
    return (
      <ul>
        <ContainerListNewItem key={'newcontainer'} containers={this.props.containers} />
        {containers}
      </ul>
    );
  }
});

module.exports = ContainerList;
