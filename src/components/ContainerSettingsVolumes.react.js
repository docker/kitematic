import _ from 'underscore';
import React from 'react/addons';
import electron from 'electron';
const remote = electron.remote;
const dialog = remote.dialog;
import { shell } from 'electron';
import util from '../utils/Util';
import metrics from '../utils/MetricsUtil';
import containerActions from '../actions/ContainerActions';

var ContainerSettingsVolumes = React.createClass({
  getInitialState: function () {
    let mounts = this.props.container.Mounts;
    return {
      dockerVol: '',
      mounts: mounts
    }
  },
  handleDockerVolChange: function (event) {
    let input = event.target;
    this.setState(prevState => ({
      dockerVol: input.value
    }));
  },
  handleChooseVolumeClick: function (dockerVol) {
    dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] }, (filenames) => {
      if (!filenames) {
        return;
      }

      var directory = filenames[0];

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
      let match = false;
      _.each(mounts, m => {
        if (m.Destination === dockerVol) {
          m.Source = util.windowsToLinuxPath(directory);
          m.Driver = null;
          match = true;
        }
      });

      // if this is a new volume
      if (!match) {
        if (!dockerVol) {
          metrics.track('Added Volume Directory', {
            from: 'settings'
          });
          dialog.showMessageBox({
            type: 'error',
            buttons: ['OK'],
            message: 'Invalid docker folder path'
          });
          return;
        }
        mounts.push({
          Destination: dockerVol,
          Source: util.windowsToLinuxPath(directory),
          Driver: null,
        });
        this.setState({ dockerVol: '' })
      }

      this.setState(prevState => ({
        dockerVol: prevState.dockerVol,
        mounts: mounts
      }));
    });
  },
  handleRemoveVolumeClick: function (dockerVol) {
    metrics.track('Removed Volume Directory', {
      from: 'settings'
    });

    let mounts = _.clone(this.state.mounts);
    mounts = _.filter(mounts, m => {
      return m.Destination != dockerVol;
    });

    this.setState(prevState => ({
      dockerVol: prevState.dockerVol,
      mounts: mounts
    }));
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
  handleSave: function () {
    let mounts = this.state.mounts;
    let binds = mounts.map(m => {
      return m.Source + ':' + m.Destination;
    });

    let hostConfig = _.extend(this.props.container.HostConfig, { Binds: binds });
    containerActions.update(this.props.container.Name, { Mounts: mounts, HostConfig: hostConfig });
  },
  render: function () {
    if (!this.props.container) {
      return false;
    }

    var isUpdating = (this.props.container.State.Updating);

    var homeDir = util.isWindows() ? util.windowsToLinuxPath(util.home()) : util.home();
    var mounts = _.map(_.union(this.state.mounts, [['', '']]), (m, i) => {
      let source = m.Source, destination = m.Destination;
      let icons;

      if (!destination) {
        destination = <input type="text" value={this.state.dockerVol} className="key line" onChange={this.handleDockerVolChange}></input>
      }
      if (!m.Source || (!util.isNative() && m.Source.indexOf(homeDir) === -1) || (m.Source.indexOf('/var/lib/docker/volumes') !== -1)) {
        icons = (
          <div>
            <a className="only-icon btn btn-positive small" disabled={this.props.container.State.Updating} onClick={this.handleChooseVolumeClick.bind(this, m.Destination || this.state.dockerVol)}><span className="icon icon-add"></span></a>
          </div>
        )
        source = (
          <span className="value-right">No Folder</span>
        );
      } else {
        let local = util.isWindows() ? util.linuxToWindowsPath(source) : source;
        icons = (
          <div>
            <a className="only-icon btn btn-action small" onClick={this.handleRemoveVolumeClick.bind(this, m.Destination)}><span className="icon icon-delete"></span></a>
            <a className="only-icon btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleChooseVolumeClick.bind(this, destination)}><span className="icon icon-edit"></span></a>
          </div>
        );
        source = (
          <a className="value-right" onClick={this.handleOpenVolumeClick.bind(this, source)}>{local.replace(process.env.HOME, '~')}</a>
        );
      }
      return (
        <tr>
          <td>{destination}</td>
          <td>{source}</td>
          <td>
            {icons}
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
          <a className="btn btn-action"
            disabled={isUpdating}
            onClick={this.handleSave}>
            Save
          </a>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsVolumes;
