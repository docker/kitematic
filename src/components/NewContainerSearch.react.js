var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var RetinaImage = require('react-retina-image');
var ImageCard = require('./ImageCard.react');
var Promise = require('bluebird');
var metrics = require('../utils/MetricsUtil');
var classNames = require('classnames');

var _recommended = [];
var _searchPromise = null;

module.exports = React.createClass({
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

    _searchPromise = Promise.delay(200).cancellable().then(() => Promise.resolve($.get('https://registry.hub.docker.com/v1/search?q=' + query))).then(data => {
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
      var query = repo.repo;
      var vals = query.split('/');
      if (vals.length === 1) {
        query = 'library/' + vals[0];
      }
      return $.get('https://registry.hub.docker.com/v1/repositories_info/' + query).then(data => {
        var res = _.extend(data, repo);
        res.description = data.short_description;
        res.is_official = data.namespace === 'library';
        res.name = data.repo;
        res.star_count = data.stars;
        return res;
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
              <div className="spinner la-ball-clip-rotate la-dark la-lg"><div></div></div>
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
    var loadingClasses = classNames({
      hidden: !this.state.loading,
      spinner: true,
      loading: true,
      'la-ball-clip-rotate': true,
      'la-dark': true,
      'la-sm': true
    });
    var magnifierClasses = classNames({
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
              Select a Docker image to create a new container.
            </div>
            <div className="search">
              <div className="search-bar">
                <input type="search" ref="searchInput" className="form-control" placeholder="Search Docker Hub for an image" onChange={this.handleChange}/>
                <div className={magnifierClasses}></div>
                <div className={loadingClasses}><div></div></div>
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
