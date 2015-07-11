var React = require('react/addons');
var Notification = require('../utils/Notification');
var containerStore = require('../stores/ContainerStore');

var ContainerDetailsHeader = React.createClass({
  getInitialState() {
    return {
      message: ''
    };
  },
  componentDidMount: function () {
    containerStore.listen(this.handleShow);
  },
  componentWillReceiveProps: function (nextProps) {
    if (nextProps.container.Name != this.props.container.Name) {
      this.handleNotificationActionClick();
    }
  },
  handleShow(contState) {
    if (contState.containers[this.props.container.Name].State.Error.length && !this.props.container.State.Paused && this.props.container.State.ExitCode && !this.props.container.State.Restarting && !this.props.container.State.Starting) {
      this.setState({
        message: contState.containers[this.props.container.Name].State.Error
      }, function() {
        this.refs.notification.show();
      });
    }
  },
  handleNotificationActionClick() {
    this.setState({
      message: ''
    }, function(){
      this.refs.notification.hide();
    });
  },
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
    let notificationStyles = {
      active:{ right: '18em' },
      bar: { right: '-100rem', top: '6.75rem', bottom: 'initial', left: 'initial' },
      action: { color: '#C92C2C' }
    };
    return (
      <div className="header-section">
        <div className="text">
          {this.props.container.Name}{state}
        </div>
        <Notification
            ref="notification"
            message={this.state.message}
            styles={notificationStyles}
            onClick={this.handleNotificationActionClick}/>
      </div>
    );
  }
});

module.exports = ContainerDetailsHeader;
