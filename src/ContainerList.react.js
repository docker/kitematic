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
      console.log(container);
      return (
        <ContainerListItem container={container} start={self._start}/>
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
