import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import Router from 'react-router';
import containerStore from '../stores/ContainerStore';
import ContainerList from './ContainerList.react';
import Header from './Header.react';
import metrics from '../utils/MetricsUtil';
import {shell} from 'electron';
import machine from '../utils/DockerMachineUtil';

var Containers = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  getInitialState: function () {
    return {
      sidebarOffset: 0,
      containers: containerStore.getState().containers,
      sorted: this.sorted(containerStore.getState().containers)
    };
  },

  componentDidMount: function () {
    containerStore.listen(this.update);
  },

  componentWillUnmount: function () {
    containerStore.unlisten(this.update);
  },

  sorted: function (containers) {
    return _.values(containers).sort(function (a, b) {
      if (a.Favorite && !b.Favorite) {
        return -1;
      } else if (!a.Favorite && b.Favorite) {
        return 1;
      } else {
        if (a.State.Downloading && !b.State.Downloading) {
          return -1;
        } else if (!a.State.Downloading && b.State.Downloading) {
          return 1;
        } else {
          if (a.State.Running && !b.State.Running) {
            return -1;
          } else if (!a.State.Running && b.State.Running) {
            return 1;
          } else {
            return a.Name.localeCompare(b.Name);
          }
        }
      }
    });
  },

  update: function () {
    let containers = containerStore.getState().containers;
    let sorted = this.sorted(containerStore.getState().containers);

    let name = this.context.router.getCurrentParams().name;
    if (containerStore.getState().pending) {
      this.context.router.transitionTo('pull');
    } else if (name && !containers[name]) {
      if (sorted.length) {
        this.context.router.transitionTo('containerHome', {name: sorted[0].Name});
      } else {
        this.context.router.transitionTo('search');
      }
    }

    this.setState({
      containers: containers,
      sorted: sorted,
      pending: containerStore.getState().pending
    });
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
    $(this.getDOMNode()).find('.new-container-item').parent().fadeIn();
    this.context.router.transitionTo('search');
    metrics.track('Pressed New Container');
  },

  handleClickPreferences: function () {
    metrics.track('Opened Preferences', {
      from: 'app'
    });
    this.context.router.transitionTo('preferences');
  },

  handleClickDockerTerminal: function () {
    metrics.track('Opened Docker Terminal', {
      from: 'app'
    });
    machine.dockerTerminal();
  },

  handleClickReportIssue: function () {
    metrics.track('Opened Issue Reporter', {
      from: 'app'
    });
    shell.openExternal('https://github.com/docker/kitematic');
  },

  render: function () {
    var sidebarHeaderClass = 'sidebar-header';
    if (this.state.sidebarOffset) {
      sidebarHeaderClass += ' sep';
    }

    var container = this.context.router.getCurrentParams().name ? this.state.containers[this.context.router.getCurrentParams().name] : {};
    return (
      <div className="containers">
        <Header />
        <div className="containers-body">
          <div className="sidebar">
            <section className={sidebarHeaderClass}>
              <h4>Containers</h4>
              <div className="create">
                <Router.Link to="search">
                  <span className="btn btn-new btn-action has-icon btn-hollow"><span className="icon icon-add"></span>New</span>
                </Router.Link>
              </div>
            </section>
            <section className="sidebar-containers" onScroll={this.handleScroll}>
              <ContainerList containers={this.state.sorted} newContainer={this.state.newContainer} />
            </section>
            <section className="sidebar-buttons">
              <span className="btn-sidebar btn-terminal" onClick={this.handleClickDockerTerminal} ><span className="icon icon-docker-cli"></span><span className="text">DOCKER CLI</span></span>
              <span className="btn-sidebar btn-feedback" onClick={this.handleClickReportIssue} ><span className="icon icon-feedback"></span></span>
              <span className="btn-sidebar btn-preferences" onClick={this.handleClickPreferences} ><span className="icon icon-preferences"></span></span>
            </section>
          </div>
          <Router.RouteHandler pending={this.state.pending} containers={this.state.containers} container={container}/>
        </div>
      </div>
    );
  }
});

module.exports = Containers;
