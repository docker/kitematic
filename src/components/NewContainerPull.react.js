import React from 'react/addons';
import Router from 'react-router';
import shell from 'shell';
import containerActions from '../actions/ContainerActions';

module.exports = React.createClass({
  mixins: [Router.Navigation],
  handleOpenClick: function () {
    var repo = this.props.pending.repo;
    if (repo.indexOf('/') === -1) {
      shell.openExternal(`https://hub.docker.com/_/${this.props.pending.repository}`);
    } else {
      shell.openExternal(`https://hub.docker.com/u/${this.props.pending.repository}`);
    }
  },
  handleCancelClick: function () {
    containerActions.clearPending();
    this.context.router.transitionTo('new');
  },
  handleConfirmClick: function () {
    containerActions.clearPending();
    
    containerActions.run(this.props.pending.name, this.props.pending.repo, this.props.pending.tag);
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