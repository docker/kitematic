import $ from 'jquery';
import React from 'react/addons';
import Router from 'react-router';
import electron from 'electron';
const remote = electron.remote;
const dialog = remote.dialog;
import metrics from '../utils/MetricsUtil';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import containerActions from '../actions/ContainerActions';

var ContainerListItem = React.createClass({
  toggleFavoriteContainer: function (e) {
    e.preventDefault();
    e.stopPropagation();
    containerActions.toggleFavorite(this.props.container.Name);
  },
  handleDeleteContainer: function (e) {
    e.preventDefault();
    e.stopPropagation();
    dialog.showMessageBox({
      message: 'Are you sure you want to stop & remove this container?',
      buttons: ['Remove', 'Cancel']
    }).then(({response}) => {
      if (response === 0) {
        metrics.track('Deleted Container', {
          from: 'list',
          type: 'existing'
        });
        containerActions.destroy(this.props.container.Name);
      }
    });
  },
  render: function () {
    var self = this;
    var container = this.props.container;
    var imageNameTokens = container.Config.Image.split('/');
    var repo;
    if (imageNameTokens.length > 1) {
      repo = imageNameTokens[1];
    } else {
      repo = imageNameTokens[0];
    }
    var imageName = (
      <OverlayTrigger placement="bottom" overlay={<Tooltip>{container.Config.Image}</Tooltip>}>
        <span>{repo}</span>
      </OverlayTrigger>
    );

    // Synchronize all animations
    var style = {
      WebkitAnimationDelay: 0 + 'ms'
    };

    var state;
    if (container.State.Downloading) {
      state = (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Downloading</Tooltip>}>
          <div className="state state-downloading">
            <div style={style} className="downloading-arrow"></div>
          </div>
        </OverlayTrigger>
      );
    } else if (container.State.Running && !container.State.Paused) {
      state = (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Running</Tooltip>}>
          <div className="state state-running"><div style={style} className="runningwave"></div></div>
        </OverlayTrigger>
      );
    } else if (container.State.Restarting) {
      state = (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Restarting</Tooltip>}>
          <div className="state state-restarting" style={style}></div>
        </OverlayTrigger>
      );
    } else if (container.State.Paused) {
      state = (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Paused</Tooltip>}>
          <div className="state state-paused"></div>
        </OverlayTrigger>
      );
    } else if (container.State.ExitCode) {
      state = (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Stopped</Tooltip>}>
          <div className="state state-stopped"></div>
        </OverlayTrigger>
      );
    } else {
      state = (
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Stopped</Tooltip>}>
          <div className="state state-stopped"></div>
        </OverlayTrigger>
      );
    }

    return (
      <Router.Link to="container" params={{name: container.Name}}>
        <li onMouseEnter={self.handleItemMouseEnter} onMouseLeave={self.handleItemMouseLeave} onClick={self.handleClick} id={this.props.key}>
          {state}
          <div className="info">
            <div className="name">
              {container.Name}
            </div>
            <div className="image">
              {imageName}
            </div>
          </div>
          <div className="action">
            <span className={container.Favorite ? 'btn circular favorite' : 'btn circular'} onClick={this.toggleFavoriteContainer}><span className="icon icon-favorite"></span></span>
            <span className="btn circular" onClick={this.handleDeleteContainer}><span className="icon icon-delete"></span></span>
          </div>
        </li>
      </Router.Link>
    );
  }
});

module.exports = ContainerListItem;
