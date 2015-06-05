var _ = require('underscore');
var React = require('react/addons');
var RetinaImage = require('react-retina-image');
var path = require('path');
var shell = require('shell');
var util = require('../utils/Util');
var metrics = require('../utils/MetricsUtil');
var containerActions = require('../actions/ContainerActions');
var dialog = require('remote').require('dialog');
var mkdirp = require('mkdirp');

var ContainerHomeFolder = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  handleClickFolder: function (hostVolume, containerVolume) {
    metrics.track('Opened Volume Directory', {
      from: 'home'
    });

    if (hostVolume.indexOf(process.env.HOME) === -1) {
      dialog.showMessageBox({
        message: 'Enable all volumes to edit files via Finder? This may not work with all database containers.',
        buttons: ['Enable Volumes', 'Cancel']
      }, (index) => {
        if (index === 0) {
          var volumes = _.clone(this.props.container.Volumes);
          var newHostVolume = path.join(util.home(), 'Kitematic', this.props.container.Name, containerVolume);
          volumes[containerVolume] = newHostVolume;
          var binds = _.pairs(volumes).map(function (pair) {
            if(util.isWindows()) {
              var home = util.home();
              home = home.charAt(0).toLowerCase() + home.slice(1);
              home = '/' + home.replace(':', '').replace(/\\/g, '/');
              var fullPath = path.join(home, 'Kitematic', pair[1], pair[0]);
              fullPath = fullPath.replace(/\\/g, '/');
              return fullPath + ':' + pair[0];
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
      shell.showItemInFolder(hostVolume);
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

    console.log(this.props.container.Volumes);
    var folders = _.map(_.omit(this.props.container.Volumes, (v, k) => k.indexOf('/Users/') !== -1), (val, key) => {
      var firstFolder = key.split('/')[1];
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
