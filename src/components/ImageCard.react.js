import $ from 'jquery';
import React from 'react/addons';
import Router from 'react-router';
import shell from 'shell';
import RetinaImage from 'react-retina-image';
import metrics from '../utils/MetricsUtil';
import containerActions from '../actions/ContainerActions';
import imageActions from '../actions/ImageActions';
import containerStore from '../stores/ContainerStore';
import tagStore from '../stores/TagStore';
import tagActions from '../actions/TagActions';
import numeral from 'numeral';

var ImageCard = React.createClass({
  mixins: [Router.Navigation],
  getInitialState: function () {
    return {
      tags: this.props.tags || [],
      chosenTag: this.props.chosenTag || 'latest'
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
      recommended: this.props.image.is_recommended,
      local: this.props.image.is_local || false
    });
    let name = containerStore.generateName(this.props.image.name);
    let localImage = this.props.image.is_local || false;
    let repo = (this.props.image.namespace === 'library' || this.props.image.namespace === 'local') ? this.props.image.name : this.props.image.namespace + '/' + this.props.image.name;

    containerActions.run(name, repo, this.state.chosenTag, localImage);
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
    let localImage = this.props.image.is_local || false;
    if (localImage) {
      tagActions.localTags(this.props.image.namespace + '/' + this.props.image.name, this.props.tags);
    } else {
      tagActions.tags(this.props.image.namespace + '/' + this.props.image.name);
    }
  },
  handleCloseTagOverlay: function () {
    let $menuOverlay = $(this.getDOMNode()).find('.menu-overlay');
    $menuOverlay.hide();
    var $tagOverlay = $(this.getDOMNode()).find('.tag-overlay');
    $tagOverlay.fadeOut(300);
  },
  handleDeleteImgClick: function (image) {
    if (this.state.chosenTag) {
      imageActions.destroy(image.RepoTags[0].split(':')[0] + ':' + this.state.chosenTag);
    }
  },
  handleRepoClick: function () {
    var repoUri = 'https://hub.docker.com/';
    if (this.props.image.namespace === 'library') {
      repoUri = repoUri + '_/' + this.props.image.name;
    } else {
      repoUri = repoUri + 'r/' + this.props.image.namespace + '/' + this.props.image.name;
    }
    shell.openExternal(repoUri);
  },
  render: function () {
    var self = this;
    var name;
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
    } else if(this.props.image.short_description){
      description = this.props.image.short_description;
    } else {
      description = 'No description.';
    }
    var logoStyle = {
      backgroundColor: this.props.image.gradient_start
    };
    var imgsrc;
    if (this.props.image.img) {
      imgsrc = `https://kitematic.com/recommended/${this.props.image.img}`;
    } else {
      imgsrc = 'https://kitematic.com/recommended/kitematic_html.png';
    }
    var tags;
    if (self.state.loading) {
      tags = <RetinaImage className="tags-loading" src="loading.png"/>;
    } else if (self.state.tags.length === 0) {
      tags = <div className="no-tags">No Tags</div>;
    } else {
      var tagDisplay = self.state.tags.map(function (tag) {
        let t = tag.name;
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

    let create;
    let overlay;
    if (this.props.image.is_local) {
      create = (
        <div className="actions">
          <div className="favorites">
            <span className="icon icon-tag"> {this.state.chosenTag}</span>
            <span className="text"></span>
          </div>
          <div className="more-menu" onClick={self.handleMenuOverlayClick}>
            <span className="icon icon-more"></span>
          </div>
          <div className="action" onClick={self.handleClick}>
            CREATE
          </div>
        </div>
      );
      overlay = (
        <div className="overlay menu-overlay">
          <div className="menu-item" onClick={this.handleTagOverlayClick.bind(this, this.props.image.name)}>
            <span className="icon icon-tag"></span><span className="text">SELECTED TAG: <span className="selected-tag">{this.state.chosenTag}</span></span>
          </div>
          <div className="remove" onClick={this.handleDeleteImgClick.bind(this, this.props.image)}>
            <span className="btn btn-delete btn-action has-icon btn-hollow"><span className="icon icon-delete"></span>Delete Tag</span>
          </div>
          <p className="small">Prior to delete, stop all containers<br/>using the above tag</p>
          <div className="close-overlay">
            <a className="btn btn-action circular" onClick={self.handleCloseMenuOverlay}><span className="icon icon-delete"></span></a>
          </div>
        </div>
      );
    } else {
      let favCount = (this.props.image.star_count < 1000) ? numeral(this.props.image.star_count).value() : numeral(this.props.image.star_count).format('0.0a').toUpperCase();
      let pullCount = (this.props.image.pull_count < 1000) ? numeral(this.props.image.pull_count).value() : numeral(this.props.image.pull_count).format('0a').toUpperCase();
      create = (
        <div className="actions">
          <div className="favorites">
            <span className="icon icon-favorite"></span>
            <span className="text">{favCount}</span>
            <span className="icon icon-download"></span>
            <span className="text">{pullCount}</span>
          </div>
          <div className="more-menu" onClick={self.handleMenuOverlayClick}>
            <span className="icon icon-more"></span>
          </div>
          <div className="action" onClick={self.handleClick}>
            CREATE
          </div>
        </div>
      );

      overlay = (
          <div className="overlay menu-overlay">
            <div className="menu-item" onClick={this.handleTagOverlayClick.bind(this, this.props.image.name)}>
              <span className="icon icon-tag"></span><span className="text">SELECTED TAG: <span className="selected-tag">{this.state.chosenTag}</span></span>
            </div>
            <div className="menu-item" onClick={this.handleRepoClick}>
              <span className="icon icon-open-external"></span><span className="text">VIEW ON DOCKER HUB</span>
            </div>
            <div className="close-overlay">
              <a className="btn btn-action circular" onClick={self.handleCloseMenuOverlay}><span className="icon icon-delete"></span></a>
            </div>
          </div>
      );
    }
    return (
      <div className="image-item">
        {overlay}
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
          {create}
        </div>
      </div>
    );
  }
});

module.exports = ImageCard;
