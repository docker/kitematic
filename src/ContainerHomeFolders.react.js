var _ = require('underscore');
var React = require('react/addons');
var RetinaImage = require('react-retina-image');
var path = require('path');
var exec = require('exec');
var metrics = require('./Metrics');
var Router = require('react-router');
var util = require('./Util');

var ContainerHomeFolder = React.createClass({
  mixins: [Router.State, Router.Navigation],
  handleClickFolder: function (path) {
    metrics.track('Opened Volume Directory', {
      from: 'home'
    });
    util.openPathOrUrl(path, function (err) {
      if (err) { throw err; }
    });
  },
  handleClickChangeFolders: function () {
    metrics.track('Viewed Volume Settings', {
      from: 'preview'
    });
    this.transitionTo('containerSettingsVolumes', {name: this.getParams().name});
  },
  render: function () {
    var folders;
    if (this.props.container) {
      var self = this;
      folders = _.map(self.props.container.Volumes, function (val, key) {
        var firstFolder = key.split(path.sep)[1];
        if (!val || val.indexOf(process.env.HOME) === -1) {
          return;
        } else {
          return (
            <div key={key} className="folder" onClick={self.handleClickFolder.bind(self, val)}>
              <RetinaImage src="folder.png" />
              <div className="text">{firstFolder}</div>
            </div>
          );
        }
      });
    }
    if (this.props.container && this.props.container.Volumes && _.keys(this.props.container.Volumes).length > 0 && this.props.container.State.Running) {
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
      return (
        <div></div>
      );
    }
  }
});

module.exports = ContainerHomeFolder;
