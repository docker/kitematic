var React = require('react/addons');
var Router = require('react-router');
var Modal = require('react-bootstrap/Modal');
var RetinaImage = require('react-retina-image');
var ModalTrigger = require('react-bootstrap/ModalTrigger');
var ContainerModal = require('./ContainerModal.react');
var ContainerStore = require('./ContainerStore');
var ContainerList = require('./ContainerList.react');
var Header = require('./Header.react');
var async = require('async');
var _ = require('underscore');
var docker = require('./docker');
var $ = require('jquery');

var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

var Containers = React.createClass({
  getInitialState: function () {
    return {
      sidebarOffset: 0
    };
  },
  handleScroll: function (e) {
    if (e.target.scrollTop > 0 && !this.state.sidebarOffset) {
      this.setState({
        sidebarOffset: e.target.scrollTop
      });
    } else if (e.target.scrollTop === 0 && this.state.sidebarOffset) {
      this.setState({
        sidebarOffset: 0
      });
    }
  },
  render: function () {
    var sidebarHeaderClass = 'sidebar-header';
    if (this.state.sidebarOffset) {
      sidebarHeaderClass += ' sep';
    }
    return (
      <div className="containers">
        <Header/>
        <div className="containers-body">
          <div className="sidebar">
            <section className={sidebarHeaderClass}>
              <h3>My Containers</h3>
              <div className="create">
                <ModalTrigger modal={<ContainerModal/>}>
                  <div className="wrapper">
                    <a className="btn btn-action only-icon"><span className="icon icon-add-1"></span></a>
                  </div>
                </ModalTrigger>
              </div>
            </section>
            <section className="sidebar-containers" onScroll={this.handleScroll}>
              <ContainerList/>
            </section>
          </div>
          <RouteHandler/>
        </div>
      </div>
    );
  }
});

module.exports = Containers;
