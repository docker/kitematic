var $ = require('jquery');
var _ = require('underscore');
var React = require('react/addons');
var Router = require('react-router');
var shell = require('shell');
var Promise = require('bluebird');
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
  getDefaultProps: function () {
    return {
      tags: []
    };
  },
  getInitialState: function () {
    return {
      chosenTag: 'later',
      makeContainer: false
    };
  },
  componentWillReceiveProps: function (nextProps) {
    if(this.state.makeContainer) {
      if (this.checkTagExists(nextProps.image)) {
        this.handleCloseTagOverlay();
      }
    }
    this.setState({loading: false});
  },
  componentWillUpdate: function (next) {
    if (tagStore.getState().currentRepo == this.props.image.namespace + '/' + this.props.image.name) {
      console.log("Current: %o - make? %o", tagStore.getState().currentRepo, this.state.makeContainer);
      if (this.state.makeContainer) {
        //this.handleClick();
        console.log("Click to make container %o - %o", this.props.tags, this.state.chosenTag);
      }
    }
  },
  checkTagExists: function (props) {
    if (props.tags.length && _.indexOf(props.tags, this.state.chosenTag) !== -1) {
      return true;
    } else {
      return false;
    }
  },
  // update: function () {
  //   let repo = this.props.image.namespace + '/' + this.props.image.name;
  //   let state = tagStore.getState();
  //   if (this.props.tags.length && !state.tags[repo]) {
  //     $(this.getDOMNode()).find('.tag-overlay').fadeOut(300);
  //   }
  //   this.setState({
  //     loading: tagStore.getState().loading[repo] || false,
  //     tags: tagStore.getState().tags[repo] || []
  //   });
  // },
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
    this.setState({ makeContainer: true });
    let name = containerStore.generateName(this.props.image.name);
    let repo = this.props.image.namespace === 'library' ? this.props.image.name : this.props.image.namespace + '/' + this.props.image.name;
    if (this.checkTagExists(this.props)) {
      console.log("making container!! %o", this.props.image);
      //containerActions.run(name, repo, this.state.chosenTag);
      //this.transitionTo('containerHome', {name});
    } else {
      console.log("Didn't find tag: %o - %o", this.state.chosenTag, this.props.image);
      tagActions.tags(this.props.image.namespace + '/' + this.props.image.name);
      this.handleTagOverlayClick();
    }
  },
  handleTagOverlayClick: function () {
    let $tagOverlay = $(this.getDOMNode()).find('.tag-overlay');
    $tagOverlay.fadeIn(300);
    if (this.props.tags.length === 0) {
      this.setState({loading: true});
      tagActions.tags(this.props.image.namespace + '/' + this.props.image.name);
    }
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
    let fullName = this.props.image.namespace + '/' + this.props.image.name;
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

    if (this.state.loading) {
      tags = <RetinaImage className="tags-loading" src="loading-white.png"/>;
    } else if (!this.props.tags || this.props.tags.length === 0) {
      tags = <span>No Tags</span>;
    } else {
      var tagDisplay = this.props.tags.map((t) => {
        if (t === this.state.chosenTag) {
          return <div className="tag active" key={t} onClick={this.handleTagClick.bind(this, t)}>{t}</div>;
        } else {
          return <div className="tag" key={t} onClick={this.handleTagClick.bind(this, t)}>{t}</div>;
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
          <p>Please select an image tag.</p>
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
