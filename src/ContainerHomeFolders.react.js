var _ = require('underscore');
var React = require('react/addons');
var RetinaImage = require('react-retina-image');
var path = require('path');
var shell = require('shell');
var util = require('./Util');
var metrics = require('./Metrics');
var Router = require('react-router');
var ContainerStore = require('./ContainerStore');

var ContainerHomeFolder = React.createClass({
  mixins: [Router.State, Router.Navigation],
  handleClickFolder: function (hostVolume, containerVolume) {
    metrics.track('Opened Volume Directory', {
      from: 'home'
    });

    if (hostVolume.indexOf(process.env.HOME) === -1) {
      var volumes = _.clone(this.props.container.Volumes);
      volumes[containerVolume] = path.join(util.home(), 'Kitematic', this.props.container.Name, containerVolume);
      var binds = _.pairs(volumes).map(function (pair) {
        return pair[1] + ':' + pair[0];
      });
      ContainerStore.updateContainer(this.props.container.Name, {
        Binds: binds
      }, function (err) {
        if (err) {
          console.log(err);
          return;
        }
        shell.showItemInFolder(hostVolume);
      });
    } else {
      shell.showItemInFolder(hostVolume);
    }
  },
  handleClickChangeFolders: function () {
    metrics.track('Viewed Volume Settings', {
      from: 'preview'
    });
    this.transitionTo('containerSettingsVolumes', {name: this.getParams().name});
  },
  render: function () {
    if (!this.props.container) {
      return false;
    }

    var folders = _.map(this.props.container.Volumes, (val, key) => {
      var firstFolder = key.split(path.sep)[1];
      return (
        <div key={key} className="folder" onClick={this.handleClickFolder.bind(this, val, key)}>
          <RetinaImage src="folder.png" />
          <div className="text">{firstFolder}</div>
        </div>
      );
    });

    if (this.props.container.Volumes && _.keys(this.props.container.Volumes).length > 0 && this.props.container.State.Running) {
      return (
        <div className="folders wrapper">
          <h4>Edit Files</h4>
          <div className="widget">
            {folders}
          </div>
          <div className="subtext" onClick={this.handleClickChangeFolders}>Change Folders</div>
        </div>
      );
    } else {
      return false;
    }
  }
});

module.exports = ContainerHomeFolder;
