import _ from 'underscore';
import React from 'react/addons';
import electron from 'electron';
const remote = electron.remote;
const dialog = remote.dialog;
import {shell} from 'electron';
import util from '../utils/Util';
import metrics from '../utils/MetricsUtil';
import containerActions from '../actions/ContainerActions';

var ContainerSettingsVolumes = React.createClass({
  getInitialState: function () {
    let container = this.props.container;

    if (!container) {
      return false;
    }
    let mounts = _.clone(container.Mounts);

    mounts.push({
      Destination: undefined,
      Mode: 'rw',
      Propagation: 'rpirvate',
      RW: true,
      Source: undefined,
      Type: 'bind'
    });

    return {
      containerName: container.Name,
      mounts
    }
  },
  handleChooseVolumeClick: function (dockerVol) {
    dialog.showOpenDialog({properties: ['openDirectory', 'createDirectory']}).then(({filePaths}) => {
      if (!filePaths) {
        return;
      }

      var directory = filePaths[0];

      if (!directory || (!util.isNative() && directory.indexOf(util.home()) === -1)) {
        dialog.showMessageBox({
          type: 'warning',
          buttons: ['OK'],
          message: 'Invalid directory - Please make sure the directory exists and you can read/write to it.'
        });
        return;
      }

      metrics.track('Choose Directory for Volume');

      let mounts = _.clone(this.state.mounts);
      _.each(mounts, m => {
        if (m.Destination === dockerVol) {
          m.Source = util.windowsToLinuxPath(directory);
          m.Driver = null;
        }
      });

      this.setState({
        mounts
      });

    });
  },
  handleRemoveVolumeClick: function (dockerVol) {
    metrics.track('Removed Volume Directory', {
      from: 'settings'
    });

    let mounts = _.clone(this.state.mounts);
    _.each(mounts, m => {
      if (m.Destination === dockerVol) {
        m.Source = null;
        m.Driver = 'local';
      }
    });

    this.setState({
      mounts
    });

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
  handleAddVolume: function () {
    let mounts = _.clone(this.state.mounts);

    // undefined is clearer when reading the code
    mounts.push({
      Destination: undefined,
      Mode: 'rw',
      Propagation: 'rpirvate',
      RW: true,
      Source: undefined,
      Type: 'bind'
    });

    this.setState({
      mounts
    });

    metrics.track('Adding Pending Volume')
  },
  handleRemoveVolume: function (index) {
    let mounts = this.state.mounts.filter((val, idx) => idx !== index);

    this.setState({
      mounts
    });

    metrics.track('Removed Volume')
  },
  handleDestinationChanged: function (index, event) {
    let mounts = _.clone(this.state.mounts);
    mounts[index].Destination = event.target.value;

    this.setState({
      mounts
    });
  },
  handleSaveVolumes: function() {
    let mounts = this.state.mounts;
    let binds = mounts.filter(m => {
      // Filter out everything that is empty/null
      return !(!m.Destination || !m.Source || m.Destination === '' || m.Source === '');
    }).map(m => {
      return m.Source + ':' + m.Destination;
    });

    let hostConfig = _.extend(this.props.container.HostConfig, {Binds: binds});

    containerActions.update(this.props.container.Name, {Mounts: mounts, HostConfig: hostConfig});
  },
  render: function () {
    if (!this.props.container) {
      return false;
    }

    var homeDir = util.isWindows() ? util.windowsToLinuxPath(util.home()) : util.home();
    var mounts = _.map(this.state.mounts, (m, index) => {
      let source = m.Source, destination = m.Destination;
      if (!m.Source || (!util.isNative() && m.Source.indexOf(homeDir) === -1) || (m.Source.indexOf('/var/lib/docker/volumes') !== -1)) {
        source = (
          <span className="value-right">No Folder</span>
        );
      } else {
        let local = util.isWindows() ? util.linuxToWindowsPath(source) : source;
        source = (
          <a className="value-right" onClick={this.handleOpenVolumeClick.bind(this, source)}>{local.replace(process.env.HOME, '~')}</a>
        );
      }

      let icon;
      if (index === this.state.mounts.length - 1) {
        icon = <a onClick={this.handleAddVolume} className="only-icon btn btn-positive small"><span
          className="icon icon-add"></span></a>;
      } else {
        icon = <a onClick={this.handleRemoveVolume.bind(this, index)} className="only-icon btn btn-action small"><span
          className="icon icon-delete"></span></a>;
      }
      return (
        <tr>
          <td>
            <input type="text" className="destination line" defaultValue={destination}
                   onChange={this.handleDestinationChanged.bind(this, index)}></input>
          </td>
          <td>{source}</td>
          <td>
            <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleChooseVolumeClick.bind(this, destination)}>Change</a>
          </td>
          <td>{icon}</td>
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
          <div className="settings-section">
            <a className="btn btn-action" disabled={this.props.container.State.Updating} onClick={this.handleSaveVolumes}>Save</a>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsVolumes;
