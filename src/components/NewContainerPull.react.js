var React = require('react/addons');
var Router = require('react-router');
var shell = require('shell');
var containerActions = require('../actions/ContainerActions');
var containerStore = require('../stores/ContainerStore');
var metrics = require('../utils/MetricsUtil');

module.exports = React.createClass({
  mixins: [Router.Navigation],
  handleOpenClick: function () {
    var repo = this.props.pending.repo;
    if (repo.indexOf('/') === -1) {
      shell.openExternal(`https://registry.hub.docker.com/_/${this.props.pending.repo}`);
    } else {
      shell.openExternal(`https://registry.hub.docker.com/u/${this.props.pending.repo}`);
    }
  },
  handleCancelClick: function () {
    metrics.track('Canceled Click-To-Pull');
    containerActions.clearPending();
    this.context.router.transitionTo('new');
  },
  handleConfirmClick: function () {
    metrics.track('Created Container', {
      from: 'click-to-pull'
    });
    containerActions.clearPending();
    let name = containerStore.generateName(this.props.pending.repo);
    containerActions.run(name, this.props.pending.repo, this.props.pending.tag);
  },
  render: function () {
    if (!this.props.pending) {
      return false;
    }
    return (
      <div className="details">
        <div className="new-container-pull">
          <div className="content">
            <h1>You&#39;re about to download and run <a onClick={this.handleOpenClick}>{this.props.pending.repo}:{this.props.pending.tag}</a>.</h1>
            <h1>Please confirm to create the container.</h1>
            <div className="buttons">
              <a className="btn btn-action" onClick={this.handleCancelClick}>Cancel</a> <a onClick={this.handleConfirmClick} className="btn btn-action">Confirm</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
});
