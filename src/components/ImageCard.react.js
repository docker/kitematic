var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var RetinaImage = require('react-retina-image');
var metrics = require('../utils/MetricsUtil');
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var Tooltip = require('react-bootstrap').Tooltip;
var util = require('../utils/Util');
var containerActions = require('../actions/ContainerActions');
var containerStore = require('../stores/ContainerStore');

var ImageCard = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      tags: [],
      chosenTag: 'latest'
    };
  },
  handleTagClick: function (tag) {
    this.setState({
      chosenTag: tag
    });
    var $tagOverlay = $(this.getDOMNode()).find('.tag-overlay');
    $tagOverlay.fadeOut(300);
    metrics.track('Selected Image Tag');
  },
  handleClick: function (repository) {
    metrics.track('Created Container', {
      from: 'search'
    });
    let name = containerStore.generateName(repository);
    containerActions.run(name, repository, this.state.chosenTag);
    this.transitionTo('containerHome', {name});
  },
  handleTagOverlayClick: function (name) {
    var $tagOverlay = $(this.getDOMNode()).find('.tag-overlay');
    $tagOverlay.fadeIn(300);
    $.get('https://registry.hub.docker.com/v1/repositories/' + name + '/tags', result => {
      this.setState({
        tags: result
      });
    });
  },
  handleCloseTagOverlay: function () {
    var $tagOverlay = $(this.getDOMNode()).find('.tag-overlay');
    $tagOverlay.fadeOut(300);
  },
  handleRepoClick: function () {
    var $repoUri = 'https://registry.hub.docker.com/';
    if (this.props.image.is_official) {
      $repoUri = $repoUri + "_/";
    } else {
      $repoUri = $repoUri + "u/";
    }
    util.exec(['open', $repoUri + this.props.image.name]);
  },
  componentDidMount: function() {
    $.get('https://registry.hub.docker.com/v1/repositories/' + this.props.image.name + '/tags', result => {
      this.setState({
        tags: result,
        chosenTag: result[0].name
      });
    });
  },
  render: function () {
    var self = this;
    var name;
    var imageNameTokens = this.props.image.name.split('/');
    var namespace;
    var repo;
    if (imageNameTokens.length > 1) {
      namespace = imageNameTokens[0];
      repo = imageNameTokens[1];
    } else {
      namespace = "official";
      repo = imageNameTokens[0];
    }
    if (this.props.image.is_official) {
      name = (
        <div>
          <div className="namespace official">{namespace}</div>
          <OverlayTrigger placement="bottom" overlay={<Tooltip>View on Docker Hub</Tooltip>}>
            <span className="repo" onClick={this.handleRepoClick}>{repo}</span>
          </OverlayTrigger>
        </div>
      );
    } else {
      name = (
        <div>
          <div className="namespace">{namespace}</div>
          <OverlayTrigger placement="bottom" overlay={<Tooltip>View on Docker Hub</Tooltip>}>
            <span className="repo" onClick={this.handleRepoClick}>{repo}</span>
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
    if (self.state.tags.length > 0) {
      var tagDisplay = self.state.tags.map(function (t) {
        if (t.name === self.state.chosenTag) {
          return <div className="tag active" key={t.name} onClick={self.handleTagClick.bind(self, t.name)}>{t.name}</div>;
        } else {
          return <div className="tag" key={t.name} onClick={self.handleTagClick.bind(self, t.name)}>{t.name}</div>;
        }
      });
      tags = (
        <div className="tag-list">
          {tagDisplay}
        </div>
      );
    } else {
      tags = <RetinaImage className="tags-loading" src="loading-white.png"/>;
    }
    var officialBadge;
    if (this.props.image.is_official) {
      officialBadge = (
        <RetinaImage src="official.png" />
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
            {officialBadge}
          </div>
          <div className="name">
            {name}
          </div>
          <div className="description">
            {description}
          </div>
          <div className="actions">
            <OverlayTrigger placement="bottom" overlay={<Tooltip>Favorites</Tooltip>}>
              <div className="stars">
                <span className="icon icon-star-9"></span>
                <span className="text">{this.props.image.star_count}</span>
              </div>
            </OverlayTrigger>
            <div className="tags">
              <span className="icon icon-bookmark-2"></span>
              <OverlayTrigger placement="bottom" overlay={<Tooltip>Change Tag</Tooltip>}>
                <span className="text" onClick={self.handleTagOverlayClick.bind(self, this.props.image.name)} data-name={this.props.image.name}>{this.state.chosenTag}</span>
              </OverlayTrigger>
            </div>
            <div className="action">
              <a className="btn btn-action" onClick={self.handleClick.bind(self, this.props.image.name)}>Create</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ImageCard;
