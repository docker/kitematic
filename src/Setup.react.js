var React = require('react/addons');
var Router = require('react-router');
var Radial = require('./Radial.react.js');
var async = require('async');
var assign = require('object-assign');
var fs = require('fs');
var path = require('path');
var virtualbox = require('./Virtualbox');
var util = require('./Util');
var SetupStore = require('./SetupStore');

var Setup = React.createClass({
  mixins: [ Router.Navigation ],
  getInitialState: function () {
    return {
      message: '',
      progress: 0
    };
  },
  componentWillMount: function () {
    SetupStore.on(SetupStore.PROGRESS_EVENT, this.update);
  },
  componentDidMount: function () {
  },
  update: function () {
    
  },
  render: function () {
    var radial;
    if (this.state.progress) {
      radial = <Radial progress={this.state.progress}/>;
    } else if (this.state.error) {
      radial = <Radial error={true} spin="true" progress="100"/>;
    } else {
      radial = <Radial spin="true" progress="100"/>;
    }
    if (this.state.error) {
      return (
        <div className="setup">
          {radial}
          <p className="error">Error: {this.state.error}</p>
        </div>
      );
    } else {
      return (
        <div className="setup">
          {radial}
          <p>{this.state.message}</p>
        </div>
      );
    }
  }
});

module.exports = Setup;
