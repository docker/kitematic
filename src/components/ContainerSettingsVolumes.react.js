import _ from 'underscore';
import React from 'react/addons';
import remote from 'remote';
var dialog = remote.require('dialog');
import shell from 'shell';
import util from '../utils/Util';
import metrics from '../utils/MetricsUtil';
import containerActions from '../actions/ContainerActions';

var ContainerSettingsVolumes = React.createClass({
  handleChooseVolumeClick: function (dockerVol) {
    dialog.showOpenDialog({properties: ['openDirectory', 'createDirectory']}, (filenames) => {
      if (!filenames) {
        return;
      }

      var directory = filenames[0];

      if (!directory || directory.indexOf(util.home()) === -1) {
        dialog.showMessageBox({
          type: 'warning',
          buttons: ['OK'],
          message: 'Invalid directory. Volume directories must be under your Users directory'
        });
        return;
      }

      metrics.track('Choose Directory for Volume');

      if(util.isWindows()) {
        directory = util.escapePath(util.windowsToLinuxPath(directory));
      }

      var mounts = _.clone(this.props.container.Mounts);
      _.each(mounts, m => {
        if (m.Destination === dockerVol) {
          m.Source = directory;
        }
      });

      var binds = mounts.map(m => {
        return m.Source + ':' + m.Destination;
      });

      containerActions.update(this.props.container.Name, {Binds: binds, Mounts: mounts});
    });
  },
  handleRemoveVolumeClick: function (dockerVol) {
    metrics.track('Removed Volume Directory', {
      from: 'settings'
    });

    var hostConfig = _.clone(this.props.container.HostConfig);
    var binds = hostConfig.Binds;
    var mounts = _.clone(this.props.container.Mounts);
    _.each(mounts, m => {
      if (m.Destination === dockerVol) {
        m.Source = null;
      }
    });
    var index = _.findIndex(binds, bind => bind.indexOf(`:${dockerVol}`) !== -1);
    if (index >= 0) {
      binds.splice(index, 1);
    }
    containerActions.update(this.props.container.Name, {HostConfig: hostConfig, Binds: binds, Mounts: mounts});
  },
  handleOpenVolumeClick: function (path) {
    metrics.track('Opened Volume Directory', {
      from: 'settings'
    });
    if (util.isWindows()) {
      shell.showItemInFolder(util.linuxToWindowsPath(path));
    } else {
      shell.showItemInFolder(path);
    }
  },
  render: function () {
    if (!this.props.container) {
      return false;
    }

    var homeDir = util.isWindows() ? util.windowsToLinuxPath(util.home()) : util.home();
    var mounts= _.map(this.props.container.Mounts, (m, i) => {
      let source = m.Source, destination = m.Destination;
      if (!m.Source || m.Source.indexOf(homeDir) === -1) {
        source = (
          <span className="value-right">No Folder</span>
        );
      } else {
        let local = util.isWindows() ? util.linuxToWindowsPath(source) : source;
        source = (
          <a className="value-right" onClick={this.handleOpenVolumeClick.bind(this, source)}>{local.replace(process.env.HOME, '~')}</a>
        );
      }
      return (
        <tr>
          <td>{destination}</td>
          <td>{source}</td>
          <td>
            <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleChooseVolumeClick.bind(this, destination)}>Change</a>
            <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleRemoveVolumeClick.bind(this, destination)}>Remove</a>
          </td>
        </tr>
      );
    });
    return (
      <div className="settings-panel">
        <div className="settings-section">
          <h3>Configure Volumes</h3>
          <table className="table volumes">
            <thead>
              <tr>
                <th>DOCKER FOLDER</th>
                <th>LOCAL FOLDER</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mounts}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsVolumes;
