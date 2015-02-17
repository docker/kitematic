var $ = require('jquery');
var React = require('react/addons');
var RetinaImage = require('react-retina-image');
var ContainerStore = require('./ContainerStore');

var ImageCard = React.createClass({
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
  },
  handleClick: function (name) {
    ContainerStore.create(name, this.state.chosenTag, function (err) {
      if (err) {
        throw err;
      }
      $(document.body).find('.new-container-item').parent().fadeOut();
    }.bind(this));
  },
  handleTagOverlayClick: function (name) {
    var $tagOverlay = $(this.getDOMNode()).find('.tag-overlay');
    $tagOverlay.fadeIn(300);
    $.get('https://registry.hub.docker.com/v1/repositories/' + name + '/tags', function (result) {
      console.log(result);
      this.setState({
        tags: result
      });
    }.bind(this));

  },
  handleCloseTagOverlay: function () {
    var $tagOverlay = $(this.getDOMNode()).find('.tag-overlay');
    $tagOverlay.fadeOut(300);
  },
  render: function () {
    var self = this;
    var name;
    if (this.props.image.is_official) {
      name = <span><RetinaImage src="official.png"/>{this.props.image.name}</span>;
    } else {
      name = <span>{this.props.image.name}</span>;
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
    if (this.state.tags.length > 0) {
      var tagDisplay = this.state.tags.map(function (t) {
        return <div className="tag" key={t.name} onClick={self.handleTagClick.bind(self, t.name)}>{t.name}</div>;
      });
      tags = (
        <div className="tag-list">
          {tagDisplay}
        </div>
      );
    } else {
      tags = <RetinaImage className="tags-loading" src="loading-white.png"/>;
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
              <span className="icon icon-tag-1"></span>
              <span className="text" onClick={self.handleTagOverlayClick.bind(self, this.props.image.name)} data-name={this.props.image.name}>{this.state.chosenTag}</span>
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
