var _ = require('underscore');
var React = require('react/addons');
var Router = require('react-router');

var ContainerSettings = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  componentWillReceiveProps: function () {
    this.init();
  },
  componentDidMount: function() {
    this.init();
  },
  init: function () {
    var currentRoute = _.last(this.context.router.getCurrentRoutes()).name;
    if (currentRoute === 'containerSettings') {
      this.context.router.transitionTo('containerSettingsGeneral', {name: this.context.router.getCurrentParams().name});
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
          <Router.RouteHandler {...this.props}/>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettings;
