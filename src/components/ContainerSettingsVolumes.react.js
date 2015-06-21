var _ = require('underscore');
var React = require('react/addons');
var remote = require('remote');
var dialog = remote.require('dialog');
var shell = require('shell');
var util = require('../utils/Util');
var metrics = require('../utils/MetricsUtil');
var containerActions = require('../actions/ContainerActions');

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
      var volumes = _.clone(this.props.container.Volumes);
      volumes[dockerVol] = directory;
      var binds = _.pairs(volumes).map(function (pair) {
        return pair[1] + ':' + pair[0];
      });

      containerActions.update(this.props.container.Name, {Binds: binds, Volumes: volumes});
    });
  },
  handleRemoveVolumeClick: function (dockerVol) {
    metrics.track('Removed Volume Directory', {
      from: 'settings'
    });

    var hostConfig = _.clone(this.props.container.HostConfig);
    var binds = hostConfig.Binds;
    var volumes = _.clone(this.props.container.Volumes);
    volumes[dockerVol] = null;
    var index = _.findIndex(binds, bind => bind.indexOf(`:${dockerVol}`) !== -1);
    if (index >= 0) {
      binds.splice(index, 1);
    }
    containerActions.update(this.props.container.Name, {HostConfig: hostConfig, Binds: binds, Volumes: volumes});
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
    var volumes = _.map(this.props.container.Volumes, (val, key) => {
      if (!val || val.indexOf(homeDir) === -1) {
        val = (
          <span className="value-right">No Folder</span>
        );
      } else {
        let local = util.isWindows() ? util.linuxToWindowsPath(val) : val;
        val = (
          <a className="value-right" onClick={this.handleOpenVolumeClick.bind(this, val)}>{local.replace(process.env.HOME, '~')}</a>
        );
      }
      return (
        <tr>
          <td>{key}</td>
          <td>{val}</td>
          <td>
            <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleChooseVolumeClick.bind(this, key)}>Change</a>
            <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleRemoveVolumeClick.bind(this, key)}>Remove</a>
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
              {volumes}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsVolumes;
