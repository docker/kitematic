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
  handleTagOverlayClick: function () {
    let $tagOverlay = $(this.getDOMNode()).find('.tag-overlay');
    $tagOverlay.fadeIn(300);
    tagActions.tags(this.props.image.namespace + '/' + this.props.image.name);
  },
  handleCloseTagOverlay: function () {
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
          <OverlayTrigger placement="bottom" overlay={<Tooltip>View on Docker Hub</Tooltip>}>
            <span className="repo" onClick={this.handleRepoClick}>{this.props.image.name}</span>
          </OverlayTrigger>
        </div>
      );
    } else {
      name = (
        <div>
          <div className="namespace">{this.props.image.namespace}</div>
          <OverlayTrigger placement="bottom" overlay={<Tooltip>View on Docker Hub</Tooltip>}>
            <span className="repo" onClick={this.handleRepoClick}>{this.props.image.name}</span>
          </OverlayTrigger>
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
      tags = <RetinaImage className="tags-loading" src="loading-white.png"/>;
    } else if (self.state.tags.length === 0) {
      tags = <span>No Tags</span>;
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
        <RetinaImage src="official.png"/>
      );
    } else if (this.props.image.is_private) {
      badge = (
        <RetinaImage src="private.png"/>
      );
    }
    return (
      <div className="image-item">
        <div className="tag-overlay" onClick={self.handleCloseTagOverlay}>
          {tags}
        </div>
        <div className="logo" style={logoStyle}>
          <RetinaImage src={imgsrc}/>
        </div>
        <div className="card">
          <div className="badges">
            {badge}
          </div>
          <div className="name">
            {name}
          </div>
          <div className="description">
            {description}
          </div>
          <div className="actions">
            <div className="stars">
              <span className="icon icon-star-9"></span>
              <span className="text">{this.props.image.star_count}</span>
            </div>
            <div className="tags">
              <span className="icon icon-bookmark-2"></span>
              <span className="text" onClick={self.handleTagOverlayClick.bind(self, this.props.image.name)} data-name={this.props.image.name}>{this.state.chosenTag}</span>
            </div>
            <div className="action">
              <a className="btn btn-action btn-positive" onClick={self.handleClick}>Create</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ImageCard;
