var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var ContainerStore = require('./ContainerStore');
var ContainerList = require('./ContainerList.react');
var Header = require('./Header.react');

var Containers = React.createClass({
  mixins: [Router.Navigation, Router.State],
  getInitialState: function () {
    return {
      sidebarOffset: 0,
      containers: ContainerStore.containers(),
      sorted: ContainerStore.sorted()
    };
  },
  componentDidMount: function () {
    this.update();
    ContainerStore.on(ContainerStore.SERVER_CONTAINER_EVENT, this.update);
    ContainerStore.on(ContainerStore.CLIENT_CONTAINER_EVENT, this.updateFromClient);

    if (this.state.sorted.length) {
      this.transitionTo('container', {name: this.state.sorted[0].Name});
    }
  },
  componentDidUnmount: function () {
    ContainerStore.removeListener(ContainerStore.SERVER_CONTAINER_EVENT, this.update);
    ContainerStore.removeListener(ContainerStore.CLIENT_CONTAINER_EVENT, this.updateFromClient);
  },
  update: function (name, status) {
    this.setState({
      containers: ContainerStore.containers(),
      sorted: ContainerStore.sorted()
    });
    if (status === 'destroy') {
      if (this.state.sorted.length) {
        this.transitionTo('container', {name: this.state.sorted[0].Name});
      } else {
        this.transitionTo('containers');
      }
    }
  },
  updateFromClient: function (name, status) {
    this.setState({
      containers: ContainerStore.containers(),
      sorted: ContainerStore.sorted()
    });
    if (status === 'create') {
      this.transitionTo('container', {name: name});
    }
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
  handleNewContainer: function () {
    console.log($(this.getDOMNode()).find('.new-container-item'));
    $(this.getDOMNode()).find('.new-container-item').parent().fadeIn();
    this.transitionTo('new');
  },
  render: function () {
    var sidebarHeaderClass = 'sidebar-header';
    if (this.state.sidebarOffset) {
      sidebarHeaderClass += ' sep';
    }

    var container = this.getParams().name ? this.state.containers[this.getParams().name] : {};
    return (
      <div className="containers">
        <Header/>
        <div className="containers-body">
          <div className="sidebar">
            <section className={sidebarHeaderClass}>
              <h4>Containers</h4>
              <div className="create">
                <span className="btn-new icon icon-add-3" onClick={this.handleNewContainer}></span>
              </div>
            </section>
            <section className="sidebar-containers" onScroll={this.handleScroll}>
              <ContainerList containers={this.state.sorted} newContainer={this.state.newContainer} />
            </section>
          </div>
          <Router.RouteHandler container={container}/>
        </div>
      </div>
    );
  }
});

module.exports = Containers;
