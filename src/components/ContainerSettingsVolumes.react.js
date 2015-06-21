var _ = require('underscore');
var React = require('react/addons');
var remote = require('remote');
var dialog = remote.require('dialog');
var ContainerUtil = require('../utils/ContainerUtil');
var shell = require('shell');
var util = require('../utils/Util');
var metrics = require('../utils/MetricsUtil');
var containerActions = require('../actions/ContainerActions');

var ContainerSettingsVolumes = React.createClass({

  getInitialState: function () {
    // Build an Array from the container 'Volumes' attribute
    let volumes = ContainerUtil.volumes(this.props.container) || [];
    volumes.push(['', '']);

    volumes = _.map(volumes, volume => {
      // Add a random ID for each lines (which will be re-used later in the
      // docker path)
      return [util.randomId(), volume[0], volume[1]];
    });

    return {
      // Save a copy of the volumes for the 'Reset' button
      originalVolumes: _.clone(volumes),
      // Mutable volumes used to build the view and add/remove containers
      volumes: volumes,
      // Store the new container path
      newVolumePath: null
    }
  },

  // Update the container Binds and Volumes from the `volumes` variable
  updateContainerBindsAndVolumes: function (volumes) {
    var binds = [];
    _.pairs(volumes).map(function (pair) {
      if (pair[1]) { binds.push(pair[1] + ':' + pair[0]) }
    });
    containerActions.update(this.props.container.Name, {Binds: binds, Volumes: volumes});
  },

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

      this.updateContainerBindsAndVolumes(volumes);
    });
  },
  handleRemoveVolumeClick: function (dockerVol) {
    metrics.track('Removed Volume Directory', {
      from: 'settings'
    });

    var volumes = _.clone(this.props.container.Volumes);
    volumes[dockerVol] = null;

    this.updateContainerBindsAndVolumes(volumes);
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
  // Store temporarily the typed path for the new volume
  handleChangeNewVolumePath: function(index, event) {
    this.setState({
      newVolumePath: event.target.value
    });
  },
  // Add the new volume in the `volumes` and add a new line for the next new
  // volume
  handleAddVolume: function (index) {
    let volumes = _.map(this.state.volumes, _.clone);
    volumes[index][2] = this.state.newVolumePath;
    volumes[index][1] = '/var/lib/docker/volumes/' + volumes[index][0] + '/_data';
    volumes.push([util.randomId(), '', '']);
    this.setState({
      volumes: volumes
    });
    metrics.track('Added Pending Volume');
  },
  // Remove the clicked volume from the `volume` variable
  handleRemoveVolume: function(index) {
    let volumes = _.map(this.state.volumes, _.clone);
    volumes.splice(index, 1);

    if (volumes.length === 0) {
      volumes.push([util.randomId(), '', '']);
    }

    this.setState({
      volumes: volumes
    });

    metrics.track('Removed Volume');
  },
  // Save all the volumes from the `volumes` variable in the container 'Volumes'
  // attribute
  handleSaveVolumes: function () {
    metrics.track('Saved Volumes');
    var volumes = {};
    _.map(this.state.volumes, (kvp, index) => {
      let [id, val, key] = kvp;
      if (key !== '') { volumes[key] = val; }
    });

    this.updateContainerBindsAndVolumes(volumes);
  },
  // Replace the `volumes` variable by a copy of `originalVolumes` where are
  // stored the original volumes
  handleResetVolumes: function() {
    let volumes = _.clone(this.state.originalVolumes);
    this.setState({
      volumes: volumes
    });
  },
  render: function () {
    if (!this.props.container) {
      return false;
    }

    var homeDir = util.isWindows() ? util.windowsToLinuxPath(util.home()) : util.home();
    var volumes = _.map(this.state.volumes, (kvp, index) => {
      let [id, val, key] = kvp;
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

      let actions;
      let icon;
      if (index === this.state.volumes.length - 1) {
        icon = <a onClick={this.handleAddVolume.bind(this, index)} className="only-icon btn btn-positive small"><span className="icon icon-add"></span></a>;
      } else {
        actions = (
          <span>
            <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleChooseVolumeClick.bind(this, key)}>Change</a>
            <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleRemoveVolumeClick.bind(this, key)}>Remove</a>
          </span>
        );
        icon = <a onClick={this.handleRemoveVolume.bind(this, index)} className="only-icon btn btn-action small"><span className="icon icon-delete"></span></a>;
      }

      let volumePath = key;
      if (key === '')
      {
        volumePath = (
          <input type="text" className="key line" onChange={this.handleChangeNewVolumePath.bind(this, index)}></input>
        );
      }

      return (
        <tr>
          <td>{volumePath}</td>
          <td>{val}</td>
          <td>
            {actions}
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
              </tr>
            </thead>
            <tbody>
              {volumes}
            </tbody>
          </table>
          <a className="btn btn-action" disabled={this.props.container.State.Updating} onClick={this.handleSaveVolumes}>Save</a>
          <a className="btn btn-action" disabled={this.props.container.State.Updating} onClick={this.handleResetVolumes}>Reset</a>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsVolumes;
