var _ = require('underscore');
var React = require('react/addons');
var remote = require('remote');
var dialog = remote.require('dialog');
var shell = require('shell');
var metrics = require('../utils/MetricsUtil');
var containerActions = require('../actions/ContainerActions');

var ContainerSettingsVolumes = React.createClass({
  handleChooseVolumeClick: function (dockerVol) {
    var self = this;
    dialog.showOpenDialog({properties: ['openDirectory', 'createDirectory']}, (filenames) => {
      if (!filenames) {
        return;
      }
      var directory = filenames[0];
      if (directory) {
        metrics.track('Chose Directory for Volume');
        var volumes = _.clone(self.props.container.Volumes);
        volumes[dockerVol] = directory;
        var binds = _.pairs(volumes).map(function (pair) {
          return pair[1] + ':' + pair[0];
        });

        containerActions.update(this.props.container.Name, {Binds: binds, Volumes: volumes});
      }
    });
  },
  handleRemoveVolumeClick: function (dockerVol) {
    metrics.track('Removed Volume Directory', {
      from: 'settings'
    });
    var volumes = _.clone(this.props.container.Volumes);
    delete volumes[dockerVol];
    var binds = _.pairs(volumes).map(function (pair) {
      return pair[1] + ':' + pair[0];
    });
    containerActions.update(this.props.container.Name, {Binds: binds, Volumes: volumes});
  },
  handleOpenVolumeClick: function (path) {
    metrics.track('Opened Volume Directory', {
      from: 'settings'
    });
    shell.showItemInFolder(path);
  },
  render: function () {
    if (!this.props.container) {
      return false;
    }

    var volumes = _.map(this.props.container.Volumes, (val, key) => {
      if (!val || val.indexOf(process.env.HOME) === -1) {
        val = (
          <span>
            <a className="value-right">No Folder</a>
            <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleChooseVolumeClick.bind(this, key)}>Change</a>
            <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleRemoveVolumeClick.bind(this, key)}>Remove</a>
          </span>
        );
      } else {
        val = (
          <span>
            <a className="value-right" onClick={this.handleOpenVolumeClick.bind(this, val)}>{val.replace(process.env.HOME, '~')}</a>
            <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleChooseVolumeClick.bind(this, key)}>Change</a>
            <a className="btn btn-action small" disabled={this.props.container.State.Updating} onClick={this.handleRemoveVolumeClick.bind(this, key)}>Remove</a>
          </span>
        );
      }
      return (
        <div key={key} className="table-values">
          <span className="value-left">{key}</span><span className="icon icon-arrow-right"></span>
          {val}
        </div>
      );
    });
    return (
      <div className="settings-panel">
        <div className="settings-section">
          <h3>Configure Volumes</h3>
          <div className="table volumes">
            <div className="table-labels">
              <div className="label-left">DOCKER FOLDER</div>
              <div className="label-right">MAC FOLDER</div>
            </div>
            {volumes}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsVolumes;
