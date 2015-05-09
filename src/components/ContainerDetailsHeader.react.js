var React = require('react/addons');

var ContainerDetailsHeader = React.createClass({
  render: function () {
    var state;
    if (!this.props.container) {
      return false;
    }

    if (this.props.container.State.Running && !this.props.container.State.Paused && !this.props.container.State.ExitCode && !this.props.container.State.Restarting) {
      state = <span className="status running">RUNNING</span>;
    } else if (this.props.container.State.Restarting) {
      state = <span className="status restarting">RESTARTING</span>;
    } else if (this.props.container.State.Paused) {
      state = <span className="status paused">PAUSED</span>;
    } else if (this.props.container.State.Starting) {
      state = <span className="status running">STARTING</span>;
    } else if (this.props.container.State.Downloading) {
      state = <span className="status downloading">DOWNLOADING</span>;
    } else {
      state = <span className="status stopped">STOPPED</span>;
    }
    return (
      <div className="details-header">
        <h1>{this.props.container.Name}</h1>{state}
      </div>
    );
  }
});

module.exports = ContainerDetailsHeader;
