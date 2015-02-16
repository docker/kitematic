var $ = require('jquery');
var React = require('react/addons');
var RetinaImage = require('react-retina-image');
var ContainerStore = require('./ContainerStore');
var Radial = require('./Radial.react');
var ImageCard = require('./ImageCard.react');

var NewContainer = React.createClass({
  _searchRequest: null,
  getInitialState: function () {
    return {
      query: '',
      results: [],
      loading: false
    };
  },
  componentDidMount: function () {
    this.setState({
      creating: []
    });
    this.refs.searchInput.getDOMNode().focus();
    ContainerStore.on(ContainerStore.CLIENT_RECOMMENDED_EVENT, this.update);
    this.update();
  },
  update: function () {
    if (!this.state.query.length) {
      this.setState({
        results: ContainerStore.recommended()
      });
    }
  },
  search: function (query) {
    if (this._searchRequest) {
      this._searchRequest.abort();
      this._searchRequest = null;
    }

    if (!query.length) {
      return;
    }

    this.setState({
      loading: true
    });

    var self = this;
    this._searchRequest = $.get('https://registry.hub.docker.com/v1/search?q=' + query, function (result) {
      self.setState({
        query: query,
        loading: false
      });
      self._searchRequest = null;
      if (self.isMounted()) {
        self.setState(result);
      }
    });
  },
  handleChange: function (e) {
    var query = e.target.value;

    if (query === this.state.query) {
      return;
    }

    clearTimeout(this.timeout);
    if (!query.length) {
      this.setState({
        query: query,
        results: ContainerStore.recommended()
      });
    } else {
      var self = this;
      this.timeout = setTimeout(function () {
        self.search(query);
      }, 200);
    }
  },
  render: function () {
    var title = this.state.query ? 'Results' : 'Recommended';
    var data = [];
    if (this.state.results) {
      data = this.state.results.slice(0, 6);
    }
    var results;
    if (data.length) {
      var items = data.map(function (image) {
        return (
          <ImageCard key={image.name} image={image} />
        );
      });

      results = (
        <div className="result-grid">
          {items}
        </div>
      );
    } else {
      if (this.state.results.length === 0 && this.state.query === '') {
        results = (
          <div className="no-results">
            <div className="loader">
              <h2>Loading Images</h2>
              <Radial spin="true" progress={90} thick={true} transparent={true} />
            </div>
          </div>
        );
      } else {
        results = (
          <div className="no-results">
            <h1>Cannot find a matching image.</h1>
          </div>
        );
      }
    }
    var loadingClasses = React.addons.classSet({
      hidden: !this.state.loading,
      loading: true
    });
    var magnifierClasses = React.addons.classSet({
      hidden: this.state.loading,
      icon: true,
      'icon-magnifier': true,
      'search-icon': true
    });
    return (
      <div className="details">
        <div className="new-container">
          <div className="new-container-header">
            <div className="text">
              Select an image to create a new container.
            </div>
            <div className="search">
              <div className="search-bar">
                <input type="search" ref="searchInput" className="form-control" placeholder="Find an image from Docker Hub" onChange={this.handleChange}/>
                <div className={magnifierClasses}></div>
                <RetinaImage className={loadingClasses} src="loading.png"/>
              </div>
            </div>
          </div>
          <div className="results">
            <h4>{title}</h4>
            {results}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = NewContainer;
