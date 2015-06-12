var React = require('react/addons');

var ContainerDetailsHeader = React.createClass({
  render: function () {
    var state;
    if (!this.props.container) {
      return false;
    }

    if (this.props.container.State.Updating) {
      state = <span className="status downloading">UPDATING</span>;
    } else if (this.props.container.State.Running && !this.props.container.State.Paused && !this.props.container.State.ExitCode && !this.props.container.State.Restarting) {
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
      <div className="header-section">
        <div className="text">
          {this.props.container.Name}{state}
        </div>
      </div>
    );
  }
});

module.exports = ContainerDetailsHeader;
