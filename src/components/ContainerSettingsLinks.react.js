var _ = require('underscore');
var React = require('react/addons');
var remote = require('remote');
var metrics = require('../utils/MetricsUtil');
var dialog = remote.require('dialog');
var ContainerUtil = require('../utils/ContainerUtil');
var containerActions = require('../actions/ContainerActions');
var containerStore = require('../stores/ContainerStore');
var util = require('../utils/Util');
var Typeahead = require('react-typeahead').Typeahead;

var ContainerSettingsLinks = React.createClass({
  //mixins: [React.addons.LinkedStateMixin],

  contextTypes: {
    router: React.PropTypes.func
  },

  getInitialState: function () {
    let links = ContainerUtil.links(this.props.container) || [];
    links.push(['', '']);
    links = _.map(links, l => {
      return [util.randomId(), l[0], l[1]];
    });
    let containers = containerStore.getState().containers;
    let sorted = _.pluck(containers, 'Name');

    return {
      links: links,
      selected: false,
      sorted: sorted
    };
  },

  handleSaveLinksVars: function () {
    metrics.track('Saved Linked Containers');
    let list = [];
    let keys = [];
    _.each(this.state.links, kvp => {
      let [, key, value] = kvp;
      if ((key && key.length) || (value && value.length)) {
        let link = key + ':' + value;
        // Check if Container was previously added
        let currentKey = keys.indexOf(key);
        if ( currentKey != -1) {
          list[currentKey] = link;
        } else {
          keys.push(key);
          list.push(link);
        }
      }
    });
    let runtimeConfig = _.extend(this.props.container.HostConfig, {Links: list});
    containerActions.update(this.props.container.Name, {HostConfig: runtimeConfig});
  },

  handleChangeLinksKey: function (index, event) {
    let links = _.map(this.state.links, _.clone);
    let selected = false;
    let value;
    if (typeof event === "string") {
      selected = true;
      value = event;
    } else {
      links[index][0] = util.randomId();
      value = event.target.value;
    }
    links[index][1] = value;
    if (links[index][2] == "") {
      links[index][0] = util.randomId();
      links[index][2] = value;
    }
    this.setState({
      links: links,
      selected: selected
    }, () => {
      if (!selected) {
        this.refs.keyTypeahead.refs.entry.getDOMNode().focus();
        this.refs.keyTypeahead.refs.entry.getDOMNode().value = value;
      }
    });
  },

  handleChangeLinksVal: function (index, event) {
    let links = _.map(this.state.links, _.clone);
    links[index][2] = event.target.value;
    this.setState({
      links: links
    });
  },

  handleAddLinksVar: function () {
    let links = _.map(this.state.links, _.clone);
    links.push([util.randomId(), '', '']);
    this.setState({
      links: links
    });
    metrics.track('Added Pending Linked Containers');
  },

  handleRemoveLinksVar: function (index) {
    let links = _.map(this.state.links, _.clone);
    links.splice(index, 1);

    if (links.length === 0) {
      links.push([util.randomId(), '', '']);
    }

    this.setState({
      links: links
    });

    metrics.track('Removed Linked Containers');
  },

  render: function () {
    if (!this.props.container) {
      return false;
    }

    let vars = _.map(this.state.links, (kvp, index) => {
      let [id, key, val] = kvp;
      let icon;
      if (index === this.state.links.length - 1) {
        icon = <a onClick={this.handleAddLinksVar} className="only-icon btn btn-positive small"><span className="icon icon-add-1"></span></a>;
      } else {
        icon = <a onClick={this.handleRemoveLinksVar.bind(this, index)} className="only-icon btn btn-action small"><span className="icon icon-cross"></span></a>;
      }

      let inputDockerContainer = (
        <input type="text" className="key line" defaultValue={key} readOnly />
      );

      if (key == "" || !this.state.selected) {
        inputDockerContainer = (
            <Typeahead
              ref="keyTypeahead"
              options={this.state.sorted}
              customClasses={{'input': 'key line'}}
              maxVisible={2}
              defaultValue={key}
              onOptionSelected={this.handleChangeLinksKey.bind(this, index)}
            />
        );
      } else if (index === this.state.links.length - 1) {
        inputDockerContainer = (
          <input type="text" className="key line" defaultValue={key} onChange={this.handleChangeLinksKey.bind(this, index)} />
        );
      }

      return (
        <div key={id} className="keyval-row">
          {inputDockerContainer}
          <input type="text" className="val line" defaultValue={val} onChange={this.handleChangeLinksVal.bind(this, index)} />
          {icon}
        </div>
      );
    });

    return (
      <div className="settings-panel">
        <div className="settings-section">
          <h3>Configure Linked Containers</h3>
          <div className="links-vars-labels">
            <div className="label-key">DOCKER CONTAINER</div>
            <div className="label-val">DOCKER ALIAS</div>
          </div>
          <div className="links-vars">
            {vars}
          </div>
          <a className="btn btn-action" disabled={this.props.container.State.Updating} onClick={this.handleSaveLinksVars}>Save</a>
        </div>
        <div className="settings-section">
          <h4><span className="icon icon-alert-1"></span> <strong>Notice</strong>:</h4>
          <ul className="text-danger">
            <li>Linked containers will only take effect if the target docker container is running</li>
          </ul>
        </div>
      </div>
    );
  }
});

module.exports = ContainerSettingsLinks;
