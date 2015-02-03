var React = require('react/addons');

var ContainerHome = React.createClass({
  render: function () {
    /*var preview;
    if (this.state.defaultPort) {
      preview = (
        <iframe src={this.state.ports[this.state.defaultPort].url} autosize="on"></iframe>
      );
    }*/
    return (
      <div className="details-panel">
        <h1>HOME</h1>
      </div>
    );
  }
});

module.exports = ContainerHome;
