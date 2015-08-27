import _ from 'underscore';
import React from 'react/addons';
import RetinaImage from 'react-retina-image';
import path from 'path';
import shell from 'shell';
import util from '../utils/Util';
import metrics from '../utils/MetricsUtil';
import containerActions from '../actions/ContainerActions';
import remote from 'remote';
var dialog = remote.require('dialog');
import mkdirp from 'mkdirp';

var ContainerHomeFolder = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  handleClickFolder: function (source, destination) {
    metrics.track('Opened Volume Directory', {
      from: 'home'
    });

    if (source.indexOf(util.windowsToLinuxPath(util.home())) === -1) {
      dialog.showMessageBox({
        message: `Enable all volumes to edit files? This may not work with all database containers.`,
        buttons: ['Enable Volumes', 'Cancel']
      }, (index) => {
        if (index === 0) {
          var mounts = _.clone(this.props.container.Mounts);
          var newSource = util.escapePath(path.join(util.home(), util.documents(), 'Kitematic', this.props.container.Name, destination));
          var binds = mounts.map(function (m) {
            let source = m.Source;
            if (m.Destination === destination) {
              source = newSource;
            }

            if(util.isWindows()) {
              return util.windowsToLinuxPath(source) + ':' + m.Destination;
            }

            return source + ':' + m.Destination;
          });

          mkdirp(newSource, function (err) {
            console.log(err);
            if (!err) {
              shell.showItemInFolder(newSource);
            }
          });

          containerActions.update(this.props.container.Name, {Binds: binds});
        }
      });
    } else {
      let path = util.isWindows() ? util.linuxToWindowsPath(source) : source;
      shell.showItemInFolder(path);
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

    var folders = _.map(this.props.container.Mounts, (m, i) => {
      let destination = m.Destination;
      let source = m.Source;
      return (
        <div key={i} className="folder" onClick={this.handleClickFolder.bind(this, source, destination)}>
          <RetinaImage src="folder.png" />
          <div className="text">{destination}</div>
        </div>
      );
    });

    return (
      <div className="folders wrapper">
        <div className="widget">
          <div className="top-bar">
            <div className="text">Volumes</div>
            <div className="action" onClick={this.handleClickChangeFolders}>
              <span className="icon icon-preferences"></span>
            </div>
          </div>
          <div className="folders-list">
            {folders}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerHomeFolder;
