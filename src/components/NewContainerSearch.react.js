var React = require('react/addons');
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
      category: 'recommended',
      recommendedrepos: [],
      publicrepos: [],
      userrepos: [],
      results: [],
      tab: 'all'
    };
  },
  componentDidMount: function () {
    // fetch recommended
    // fetch public repos
    // if logged in: my repos
    this.refs.searchInput.getDOMNode().focus();
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

    _searchPromise = Promise.delay(200).cancellable().then(() => {
      metrics.track('Searched for Images');
      _searchPromise = null;
      // TODO: call search action
    }).catch(Promise.CancellationError, () => {});
  },
  handleChange: function (e) {
    var query = e.target.value;
    if (query === this.state.query) {
      return;
    }
    this.search(query);
  },
  render: function () {
    var data = this.state.recommendedrepos;
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

    let loadingClasses = classNames({
      hidden: !this.state.loading,
      spinner: true,
      loading: true,
      'la-ball-clip-rotate': true,
      'la-dark': true,
      'la-sm': true
    });

    let magnifierClasses = classNames({
      hidden: this.state.loading,
      icon: true,
      'icon-magnifier': true,
      'search-icon': true
    });

    let allTabClasses = classNames({
      'results-filter': 
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
            <div className="results-filters">
              <span className="results-filter results-filter-title">FILTER BY</span>
              <span className="results-filter results-all tab">All</span>
              <span className="results-filter results-recommended tab">Recommended</span>
              <span className="results-filter results-userrepos tab">My Repositories</span>
            </div>
            {results}
          </div>
        </div>
      </div>
    );
  }
});
