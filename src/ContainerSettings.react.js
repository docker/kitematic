var _ = require('underscore');
var React = require('react/addons');
var Router = require('react-router');

var ContainerSettings = React.createClass({
  mixins: [Router.State, Router.Navigation],
  componentWillReceiveProps: function () {
    this.init();
  },
  componentDidMount: function() {
    this.init();
  },
  init: function () {
    var currentRoute = _.last(this.getRoutes()).name;
    if (currentRoute === 'containerSettings') {
      this.transitionTo('containerSettingsGeneral', {name: this.getParams().name});
    }
  },
  render: function () {
    var container = this.props.container;
    if (!container) {
      return (<div></div>);
    }
    return (
      <div className="details-panel">
        <div className="settings">
          <div className="settings-menu">
            <ul>
              <Router.Link to="containerSettingsGeneral" params={{name: container.Name}}>
                <li>
                  General
                </li>
              </Router.Link>
              <Router.Link to="containerSettingsPorts" params={{name: container.Name}}>
                <li>
                  Ports
                </li>
              </Router.Link>
              <Router.Link to="containerSettingsVolumes" params={{name: container.Name}}>
                <li>
                  Volumes
                </li>
              </Router.Link>
            </ul>
          </div>
          <Router.RouteHandler container={container}/>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettings;
