var _ = require('underscore');
var React = require('react/addons');
var Router = require('react-router');
var remote = require('remote');
var exec = require('exec');
var dialog = remote.require('dialog');
var metrics = require('./Metrics');
var ContainerStore = require('./ContainerStore');
var util = require('./Util');

var ContainerSettingsVolumes = React.createClass({
  mixins: [Router.State, Router.Navigation],
  handleChooseVolumeClick: function (dockerVol) {
    var self = this;
    dialog.showOpenDialog({properties: ['openDirectory', 'createDirectory']}, function (filenames) {
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
        ContainerStore.updateContainer(self.props.container.Name, {
          Binds: binds
        }, function (err) {
          if (err) { console.log(err); }
        });
      }
    });
  },
  handleOpenVolumeClick: function (path) {
    metrics.track('Opened Volume Directory', {
      from: 'settings'
    });
    util.openPathOrUrl(path, function (err) {
      if (err) { throw err; }
    });
  },
  render: function () {
    if (!this.props.container) {
      return (<div></div>);
    }
    var self = this;
    var volumes = _.map(self.props.container.Volumes, function (val, key) {
      if (!val || val.indexOf(process.env.HOME) === -1) {
        val = (
          <span>
            <a className="value-right">No Folder</a>
            <a className="btn btn-action small" onClick={self.handleChooseVolumeClick.bind(self, key)}>Change</a>
          </span>
        );
      } else {
        val = (
          <span>
            <a className="value-right" onClick={self.handleOpenVolumeClick.bind(self, val)}>{val.replace(process.env.HOME, '~')}</a>
            <a className="btn btn-action small" onClick={self.handleChooseVolumeClick.bind(self, key)}>Change</a>
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
