var _ = require('underscore');
var React = require('react/addons');
var ContainerDetailsHeader = require('./ContainerDetailsHeader.react');
var ContainerDetailsSubheader = require('./ContainerDetailsSubheader.react');
var Router = require('react-router');

var ContainerDetail = React.createClass({
  mixins: [Router.State, Router.Navigation],
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
    var currentRoute = _.last(this.getRoutes()).name;
    if (currentRoute === 'containerDetails') {
      this.transitionTo('containerHome', {name: this.getParams().name});
    }
  },
  render: function () {
    return (
      <div className="details">
        <ContainerDetailsHeader container={this.props.container}/>
        <ContainerDetailsSubheader container={this.props.container} />
        <Router.RouteHandler container={this.props.container}/>
      </div>
    );
  }
});

module.exports = ContainerDetail;
