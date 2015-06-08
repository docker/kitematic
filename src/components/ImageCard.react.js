var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var shell = require('shell');
var RetinaImage = require('react-retina-image');
var metrics = require('../utils/MetricsUtil');
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var Tooltip = require('react-bootstrap').Tooltip;
var containerActions = require('../actions/ContainerActions');
var containerStore = require('../stores/ContainerStore');
var tagStore = require('../stores/TagStore');
var tagActions = require('../actions/TagActions');

var ImageCard = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      tags: [],
      chosenTag: 'latest'
    };
  },
  componentDidMount: function () {
    tagStore.listen(this.update);
  },
  componentWillUnmount: function () {
    tagStore.unlisten(this.update);
  },
  update: function () {
    let repo = this.props.image.namespace + '/' + this.props.image.name;
    let state = tagStore.getState();
    if (this.state.tags.length && !state.tags[repo]) {
      $(this.getDOMNode()).find('.tag-overlay').fadeOut(300);
    }
    this.setState({
      loading: tagStore.getState().loading[repo] || false,
      tags: tagStore.getState().tags[repo] || []
    });
  },
  handleTagClick: function (tag) {
    this.setState({
      chosenTag: tag
    });
    var $tagOverlay = $(this.getDOMNode()).find('.tag-overlay');
    $tagOverlay.fadeOut(300);
    metrics.track('Selected Image Tag');
  },
  handleClick: function () {
    metrics.track('Created Container', {
      from: 'search',
      private: this.props.image.is_private,
      official: this.props.image.namespace === 'library',
      userowned: this.props.image.is_user_repo,
      recommended: this.props.image.is_recommended
    });
    let name = containerStore.generateName(this.props.image.name);
    let repo = this.props.image.namespace === 'library' ? this.props.image.name : this.props.image.namespace + '/' + this.props.image.name;
    containerActions.run(name, repo, this.state.chosenTag);
    this.transitionTo('containerHome', {name});
  },
  handleMenuOverlayClick: function () {
    let $menuOverlay = $(this.getDOMNode()).find('.menu-overlay');
    $menuOverlay.fadeIn(300);
  },
  handleCloseMenuOverlay: function () {
    var $menuOverlay = $(this.getDOMNode()).find('.menu-overlay');
    $menuOverlay.fadeOut(300);
  },
  handleTagOverlayClick: function () {
    let $tagOverlay = $(this.getDOMNode()).find('.tag-overlay');
    $tagOverlay.fadeIn(300);
    tagActions.tags(this.props.image.namespace + '/' + this.props.image.name);
  },
  handleCloseTagOverlay: function () {
    let $menuOverlay = $(this.getDOMNode()).find('.menu-overlay');
    $menuOverlay.hide();
    var $tagOverlay = $(this.getDOMNode()).find('.tag-overlay');
    $tagOverlay.fadeOut(300);
  },
  handleRepoClick: function () {
    var repoUri = 'https://registry.hub.docker.com/';
    if (this.props.image.namespace === 'library') {
      repoUri = repoUri + '_/' + this.props.image.name;
    } else {
      repoUri = repoUri + 'u/' + this.props.image.namespace + '/' + this.props.image.name;
    }
    shell.openExternal(repoUri);
  },
  render: function () {
    var self = this;
    let name;
    if (this.props.image.namespace === 'library') {
      name = (
        <div>
          <div className="namespace official">official</div>
          <span className="repo">{this.props.image.name}</span>
        </div>
      );
    } else {
      name = (
        <div>
          <div className="namespace">{this.props.image.namespace}</div>
          <span className="repo">{this.props.image.name}</span>
        </div>
      );
    }
    var description;
    if (this.props.image.description) {
      description = this.props.image.description;
    } else {
      description = "No description.";
    }
    var logoStyle = {
      backgroundImage: `linear-gradient(-180deg, ${this.props.image.gradient_start} 4%, ${this.props.image.gradient_end}  100%)`
    };
    var imgsrc;
    if (this.props.image.img) {
      imgsrc = `http://kitematic.com/recommended/${this.props.image.img}`;
    } else {
      imgsrc = 'http://kitematic.com/recommended/kitematic_html.png';
    }
    var tags;
    if (self.state.loading) {
      tags = <RetinaImage className="tags-loading" src="loading.png"/>;
    } else if (self.state.tags.length === 0) {
      tags = <div className="no-tags">No Tags</div>;
    } else {
      var tagDisplay = self.state.tags.map(function (t) {
        if (t === self.state.chosenTag) {
          return <div className="tag active" key={t} onClick={self.handleTagClick.bind(self, t)}>{t}</div>;
        } else {
          return <div className="tag" key={t} onClick={self.handleTagClick.bind(self, t)}>{t}</div>;
        }
      });
      tags = (
        <div className="tag-list">
          {tagDisplay}
        </div>
      );
    }
    var badge = null;
    if (this.props.image.namespace === 'library') {
      badge = (
        <span className="icon icon-badge-official"></span>
      );
    } else if (this.props.image.is_private) {
      badge = (
        <span className="icon icon-badge-private"></span>
      );
    }
    return (
      <div className="image-item">
        <div className="overlay menu-overlay">
          <div className="menu-item" onClick={this.handleTagOverlayClick.bind(this, this.props.image.name)}>
            SELECTED TAG: <span className="selected-tag">{this.state.chosenTag}</span>
          </div>
          <div className="menu-item" onClick={this.handleRepoClick}>
            VIEW ON DOCKER HUB
          </div>
          <div className="close-overlay">
            <a className="btn btn-action circular" onClick={self.handleCloseMenuOverlay}><span className="icon icon-delete"></span></a>
          </div>
        </div>
        <div className="overlay tag-overlay">
          <p>Please select an image tag.</p>
          {tags}
          <div className="close-overlay" onClick={self.handleCloseTagOverlay}>
            <a className="btn btn-action circular"><span className="icon icon-delete"></span></a>
          </div>
        </div>
        <div className="logo" style={logoStyle}>
          <RetinaImage src={imgsrc}/>
        </div>
        <div className="card">
          <div className="info">
            <div className="badges">
              {badge}
            </div>
            <div className="name">
              {name}
            </div>
            <div className="description">
              {description}
            </div>
          </div>
          <div className="actions">
            <div className="favorites">
              <span className="icon icon-favorite"></span>
              <span className="text">{this.props.image.star_count}</span>
            </div>
            <div className="more-menu" onClick={self.handleMenuOverlayClick}>
              <span className="icon icon-more"></span>
            </div>
            <div className="action" onClick={self.handleClick}>
              CREATE
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ImageCard;
