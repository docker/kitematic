import _ from 'underscore';
import React from 'react/addons';
import RetinaImage from 'react-retina-image';
import path from 'path';
import shell from 'shell';
import util from '../utils/Util';
import metrics from '../utils/MetricsUtil';
import containerActions from '../actions/ContainerActions';
import remote from 'remote';
var dialog = remote.require('dialog');
import mkdirp from 'mkdirp';

var ContainerHomeFolder = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  handleClickFolder: function (hostVolume, containerVolume) {
    metrics.track('Opened Volume Directory', {
      from: 'home'
    });

    if (hostVolume.indexOf(util.windowsToLinuxPath(util.home())) === -1) {
      dialog.showMessageBox({
        message: `Enable all volumes to edit files? This may not work with all database containers.`,
        buttons: ['Enable Volumes', 'Cancel']
      }, (index) => {
        if (index === 0) {
          var volumes = _.clone(this.props.container.Volumes);
          var newHostVolume = util.escapePath(path.join(util.home(), util.documents(), 'Kitematic', this.props.container.Name, containerVolume));
          volumes[containerVolume] = newHostVolume;
          var binds = _.pairs(volumes).map(function (pair) {
            if(util.isWindows()) {
              return util.windowsToLinuxPath(pair[1]) + ':' + pair[0];
            }
            return pair[1] + ':' + pair[0];
          });
          mkdirp(newHostVolume, function (err) {
            console.log(err);
            if (!err) {
              shell.showItemInFolder(newHostVolume);
            }
          });

          containerActions.update(this.props.container.Name, {Binds: binds});
        }
      });
    } else {
      let path = util.isWindows() ? util.linuxToWindowsPath(hostVolume) : hostVolume;
      shell.showItemInFolder(path);
    }
  },
  handleClickChangeFolders: function () {
    metrics.track('Viewed Volume Settings', {
      from: 'preview'
    });
    this.context.router.transitionTo('containerSettingsVolumes', {name: this.context.router.getCurrentParams().name});
  },
  render: function () {
    if (!this.props.container) {
      return false;
    }

    var folders = _.map(_.omit(this.props.container.Volumes, (v, k) => k.indexOf('/Users/') !== -1), (val, key) => {
      var firstFolder = key;
      return (
        <div key={key} className="folder" onClick={this.handleClickFolder.bind(this, val, key)}>
          <RetinaImage src="folder.png" />
          <div className="text">{firstFolder}</div>
        </div>
      );
    });

    return (
      <div className="folders wrapper">
        <div className="widget">
          <div className="top-bar">
            <div className="text">Volumes</div>
            <div className="action" onClick={this.handleClickChangeFolders}>
              <span className="icon icon-preferences"></span>
            </div>
          </div>
          <div className="folders-list">
            {folders}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerHomeFolder;
