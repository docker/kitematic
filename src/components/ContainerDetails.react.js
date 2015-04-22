var _ = require('underscore');
var React = require('react/addons');
var ContainerDetailsHeader = require('./ContainerDetailsHeader.react');
var ContainerDetailsSubheader = require('./ContainerDetailsSubheader.react');
var Router = require('react-router');

var ContainerDetail = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    return {
      currentRoute: null
    };
  },
  componentWillReceiveProps: function () {
    this.init();
  },
  componentDidMount: function () {
    this.init();
  },
  init: function () {
    var currentRoute = _.last(this.context.router.getCurrentRoutes()).name;
    if (currentRoute === 'containerDetails') {
      this.context.router.transitionTo('containerHome', {name: this.context.router.getCurrentParams().name});
    }
  },
  render: function () {
    return (
      <div className="details">
        <ContainerDetailsHeader container={this.props.container}/>
        <ContainerDetailsSubheader container={this.props.container} />
        <Router.RouteHandler container={this.props.container} error={this.props.error}/>
      </div>
    );
  }
});

module.exports = ContainerDetail;
