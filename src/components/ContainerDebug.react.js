var React = require('react/addons');
var containerActions = require('../actions/ContainerActions');

var ContainerDebug = React.createClass({

  getInitialState: function () {
    return {
      containerJson: null
    }
  },

  componentDidMount: function() {
    if (!this.props.container) {
      return;
    }

    this.fetchContainerJson();
  },

  fetchContainerJson: function () {
    containerActions.inspect(this.props.container.Name, this, function (result, component) {
      var containerJsonString = JSON.stringify(result, null, 4);
      component.setState({
        containerJson: containerJsonString
      });
    });
  },

  render: function () {
    if (!this.props.container) {
      return false;
    }

    return (
      <div className="details-panel">
        <div className="settings">
          <div className="settings-panel">
            <h3>Container inspector</h3>
            <pre className="selectable-text">{this.state.containerJson}</pre>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerDebug;
