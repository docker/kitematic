import _ from 'underscore';
import React from 'react/addons';
import electron from 'electron';
const remote = electron.remote;
const dialog = remote.dialog;
import shell from 'shell';
import util from '../utils/Util';
import metrics from '../utils/MetricsUtil';
import containerActions from '../actions/ContainerActions';

var ContainerSettingsVolumes = React.createClass({
  handleChooseVolumeClick: function (index) {
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

      this.props.container.Mounts[index].Source = util.windowsToLinuxPath(directory);
      this.props.container.Mounts[index].Driver = null;

      this.setState({});

    });
  },
  handleRemoveVolumeClick: function (index) {
    metrics.track('Removed Volume Directory', {
      from: 'settings'
    });

    this.props.container.Mounts[index].Source = null;
    this.props.container.Mounts[index].Driver = 'local';
    this.setState({});
  },
  handleAddVolume: function(){
    this.props.container.Mounts.push({
      Source: '',
      Destination: '',
      RW: true,
      Propagation: "rprivate"
    });
    this.setState({});
  },
  handleRemoveVolume: function(index){
    this.props.container.Mounts.splice(index, 1);
    this.setState({});
  },
  handleChangeDockerFolder: function(index, event){
    let destination = event.target.value;
    this.props.container.Mounts[index].Destination = destination;
    this.setState({});
  },
  handleSave : function(){
    var mounts = [];

    _.each(this.props.container.Mounts, m => {
      if (m.Destination && m.Destination.length){
        if (!(m.Source && m.Source.length)){
          m.Source = null;
          m.Driver = 'local';
        }
        mounts.push(m);
      }
    });

    let binds = mounts.map(m => {
      return m.Source + ':' + m.Destination;
    });

    let hostConfig = _.extend(this.props.container.HostConfig, {Binds: binds});

    containerActions.update(this.props.container.Name, {Mounts: mounts, HostConfig: hostConfig});
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

    var isValid = true;

    if (!this.props.container) {
      return false;
    }

    var homeDir = util.isWindows() ? util.windowsToLinuxPath(util.home()) : util.home();
    if (!this.props.container.Mounts || !this.props.container.Mounts.length){
      this.props.container.Mounts = [{
        Source: '',
        Destination: '',
        RW: true,
        Propagation: "rprivate"
      }];
    }
    var mountsLength = this.props.container.Mounts.length;
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

      let icon;
      if (i === mountsLength - 1) {
        icon = <a onClick={this.handleAddVolume} className="only-icon btn btn-positive small"><span className="icon icon-add"></span></a>;
      } else {
        icon = <a onClick={this.handleRemoveVolume.bind(this, i)} className="only-icon btn btn-action small"><span className="icon icon-delete"></span></a>;
      }

      return (
          <tr>
            <td><input type="text" className="key line" oldValue={destination} defaultValue={destination} value={destination} onChange={this.handleChangeDockerFolder.bind(this, i)}></input></td>
            <td>{source}</td>
            <td>
              <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleChooseVolumeClick.bind(this, i)}>Change</a>
              <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleRemoveVolumeClick.bind(this, i)}>Remove</a>
            </td>
            <td>
              {icon}
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
              <th></th>
            </tr>
            </thead>
            <tbody>
            {mounts}
            </tbody>
          </table>
          <a className="btn btn-action"
             disabled={/*isUpdating ||*/ !isValid}
             onClick={this.handleSave}>
            Save
          </a>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsVolumes;
