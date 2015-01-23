var React = require('react/addons');
var RetinaImage = require('react-retina-image');

var NoContainers = React.createClass({
  render: function () {
    return (
      <div className="no-containers">
        <RetinaImage src="roundedcontainer.png"/>
        <h3>No Containers</h3>
      </div>
    );
  }
});

module.exports = NoContainers;
