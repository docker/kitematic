import React from 'react/addons';
import ContainerListItem from './ContainerListItem.react';
import _ from 'underscore';

var ContainerList = React.createClass({
  componentWillMount: function () {
    this.start = Date.now();
  },
  render: function () {
    let groupContainers = [];
    let composeRegex = /(\w+)_\w+_\d/i;
    this.props.containers.map(container => {
      let parentMatch = container.Name.match(composeRegex);
      console.log('Parent: %o - container: %o', parentMatch, container);
      if (parentMatch) {
        let parentName = parentMatch[1];
        console.log('Looking at: %o - parent: %o - group: %o', container, parentName, groupContainers);
        let index = _.findIndex(groupContainers, {parentName: parentName});
        if (index !== -1) {
          groupContainers[index].containers.push(container);
        } else {
          groupContainers.push({parentName: parentName, containers: [container]});
        }
      } else {
        groupContainers.unshift({parentName: container.Name, containers: [container]});
      }
    });
    console.log('Groups: %o', groupContainers);
    var containers = _.map(groupContainers, (containerObject) => {
      let listItem;
      let parentName = containerObject.parentName;
      let containerArray = containerObject.containers;
      if (containerArray.length > 1) {
        let listItems = containerArray.map(container => {
          container.Name = container.Name.replace(parentName + '_', '');
          return (
            <ContainerListItem key={container.Id} container={container} start={this.start} />
          );
        });
        listItem = (
          <li key={parentName} className="composed">
            <h3>{parentName}</h3>
            <ul>
            {listItems}
            </ul>
          </li>
        );
      } else {
        let container = containerArray[0];
        listItem = (
          <ContainerListItem key={container.Id} container={container} start={this.start} />
        );
      }
      return listItem;
    });
    return (
      <ul>
        {containers}
      </ul>
    );
  }
});

module.exports = ContainerList;
