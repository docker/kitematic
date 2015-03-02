var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var RetinaImage = require('react-retina-image');
var Radial = require('./Radial.react');
var ImageCard = require('./ImageCard.react');
var Promise = require('bluebird');
var metrics = require('./Metrics');

var _recommended = [];
var _searchPromise = null;

var NewContainer = React.createClass({
  getInitialState: function () {
    return {
      query: '',
      loading: false,
      results: _recommended
    };
  },
  componentDidMount: function () {
    this.refs.searchInput.getDOMNode().focus();
    this.recommended();
  },
  componentWillUnmount: function () {
    if (_searchPromise) {
      _searchPromise.cancel();
    }
  },
  search: function (query) {
    if (_searchPromise) {
      _searchPromise.cancel();
      _searchPromise = null;
    }

    if (!query.length) {
      this.setState({
        query: query,
        results: _recommended,
        loading: false
      });
      return;
    }

    this.setState({
      query: query,
      loading: true
    });

    _searchPromise = Promise.delay(200).then(() => Promise.resolve($.get('https://registry.hub.docker.com/v1/search?q=' + query))).cancellable().then(data => {
      metrics.track('Searched for Images');
      this.setState({
        results: data.results,
        query: query,
        loading: false
      });
      _searchPromise = null;
    }).catch(Promise.CancellationError, () => {
    });
  },
  recommended: function () {
    if (_recommended.length) {
      return;
    }
    Promise.resolve($.ajax({
      url: 'https://kitematic.com/recommended.json',
      cache: false,
      dataType: 'json',
    })).then(res => res.repos).map(repo => {
      return $.get('https://registry.hub.docker.com/v1/search?q=' + repo.repo).then(data => {
        var results = data.results;
        var result = _.find(results, function (r) {
          return r.name === repo.repo;
        });
        return _.extend(result, repo);
      });
    }).then(results => {
      _recommended = results.filter(r => !!r);
      if (!this.state.query.length && this.isMounted()) {
        this.setState({
          results: _recommended
        });
      }
    }).catch(err => {
      console.log(err);
    });
  },
  handleChange: function (e) {
    var query = e.target.value;
    if (query === this.state.query) {
      return;
    }
    this.search(query);
  },
  render: function () {
    var title = this.state.query ? 'Results' : 'Recommended';
    var data = this.state.results;
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
                <input type="search" ref="searchInput" className="form-control" placeholder="Search Docker Hub for an image" onChange={this.handleChange}/>
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
