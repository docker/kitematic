var _ = require('underscore');
var React = require('react/addons');
var Router = require('react-router');
var RetinaImage = require('react-retina-image');
var InfiniteGrid = require('./InfiniteGrid.react');
var ImageCard = require('./ImageCard.react');
var Promise = require('bluebird');
var metrics = require('../utils/MetricsUtil');
var classNames = require('classnames');
var repositoryActions = require('../actions/RepositoryActions');
var repositoryStore = require('../stores/RepositoryStore');
var accountStore = require('../stores/AccountStore');
var accountActions = require('../actions/AccountActions');



var _searchPromise = null;

module.exports = React.createClass({
  mixins: [Router.Navigation, Router.State],
  getInitialState: function () {
    return {
      query: '',
      page: 1,
      pageLimit: repositoryStore.getLimit(),
      maxResults: repositoryStore.getMaxResults(),
      loading: repositoryStore.loading(),
      repos: this.getRepos(),
      otherItems: [],
      username: accountStore.getState().username,
      verified: accountStore.getState().verified,
      accountLoading: accountStore.getState().loading,
      error: repositoryStore.getState().error
    };
  },
  getRepos: function () {
    let allRepos = repositoryStore.all();
    let repos = [];
    let filter = this.getQuery().filter || 'all';
    if (allRepos.length && this.state) {
      repos = _.values(allRepos)
                  .filter(repo => repo.name.toLowerCase().indexOf(this.state.query.toLowerCase()) !== -1 || repo.namespace.toLowerCase().indexOf(this.state.query.toLowerCase()) !== -1)
                  .filter(repo => filter === 'all' || (filter === 'recommended' && repo.is_recommended) || (filter === 'userrepos' && repo.is_user_repo));
    }
    return repos;
  },
  componentDidMount: function () {
    this.refs.searchInput.getDOMNode().focus();
    repositoryStore.listen(this.update);
    accountStore.listen(this.updateAccount);
    repositoryActions.search();
  },
  componentWillUnmount: function () {
    if (_searchPromise) {
      _searchPromise.cancel();
    }

    repositoryStore.unlisten(this.update);
    accountStore.unlisten(this.updateAccount);
  },
  update: function () {
    let currentPage = this.state.page;
    let repos = this.getRepos();
    let otherItems = repos.filter(repo => !repo.is_recommended && !repo.is_user_repo);
    if (this.state.page > 1) {
      otherItems = _.union(this.state.otherItems, otherItems);
    }
    if (!currentPage || currentPage == 1) {
      this.setState({
        loading: repositoryStore.loading(),
        repos: repos,
        otherItems: otherItems,
        pageLimit: repositoryStore.getLimit(),
        maxResults: repositoryStore.getMaxResults()
      });
    } else {
      this.setState({
        otherItems: otherItems,
        pageLimit: repositoryStore.getLimit(),
        maxResults: repositoryStore.getMaxResults()
      });
    }
  },
  updateAccount: function () {
    this.setState({
      username: accountStore.getState().username,
      verified: accountStore.getState().verified,
      accountLoading: accountStore.getState().loading
    });
  },
  search: function (query, page = 1) {
    if (_searchPromise) {
      _searchPromise.cancel();
      _searchPromise = null;
    }
    let loading = true;
    if (page > 1) {
      loading = false;
    } else {
      // Bring scroll to the top
      if (this.refs.parentGrid) {
        this.refs.parentGrid.getDOMNode().scrollTop = 0;
      }
    }
    this.setState({
      query: query,
      page: page,
      loading: loading
    });

    _searchPromise = Promise.delay(200).cancellable().then(() => {
      metrics.track('Searched for Images');
      _searchPromise = null;
      repositoryActions.search(query, page);
    }).catch(Promise.CancellationError, () => {});
  },
  handleChange: function (e) {
    var query = e.target.value;
    if (query === this.state.query) {
      return;
    }
    this.search(query);
  },
  handleFilter: function (filter) {
    console.log("Filtering results");

    // If we're clicking on the filter again - refresh
    if (filter === 'userrepos' && this.getQuery().filter === 'userrepos') {
      repositoryActions.repos();
    }

    if (filter === 'recommended' && this.getQuery().filter === 'recommended') {
      repositoryActions.recommended();
    }

    this.transitionTo('search', {}, {filter: filter});

    metrics.track('Filtered Results', {
      filter: filter
    });
  },
  handleInfiniteLoad:  function(e) {
    let nextPage = this.state.page+1;
    let query = this.state.query;
    if (nextPage <= this.state.pageLimit) {
      this.search(query, nextPage);
    }
  },
  handleScroll: function(e) {
    if (this.refs.itemGrid) {
      this.refs.itemGrid._scrollListener(e);
    }
  },
  handleCheckVerification: function () {
    accountActions.verify();
    metrics.track('Verified Account', {
      from: 'search'
    });
  },
  render: function () {
    let filter = this.getQuery().filter || 'all';
    let repos = this.state.repos;

    let results;
    if (this.state.error) {
      results = (
        <div className="no-results">
          <h2>There was an error contacting Docker Hub.</h2>
        </div>
      );
    } else if (filter === 'userrepos' && !accountStore.getState().username) {
      results = (
        <div className="no-results">
          <h2><Router.Link to="login">Log In</Router.Link>  or  <Router.Link to="signup">Sign Up</Router.Link> to access your Docker Hub repositories.</h2>
          <RetinaImage src="connect-art.png" checkIfRetinaImgExists={false}/>
        </div>
      );
    } else if (filter === 'userrepos' && !accountStore.getState().verified) {
      let spinner = this.state.accountLoading ? <div className="spinner la-ball-clip-rotate la-dark"><div></div></div> : null;
      results = (
        <div className="no-results">
          <h2>Please verify your Docker Hub account email address</h2>
          <div className="verify">
            <button className="btn btn-primary btn-lg" onClick={this.handleCheckVerification}>{'I\'ve Verified My Email Address'}</button> {spinner}
          </div>
          <RetinaImage src="inspection.png" checkIfRetinaImgExists={false}/>
        </div>
      );
    } else if (this.state.loading) {
      results = (
        <div className="no-results">
          <div className="loader">
            <h2>Loading Images</h2>
            <div className="spinner la-ball-clip-rotate la-dark la-lg"><div></div></div>
          </div>
        </div>
      );
    } else if (repos.length) {
      let recommendedItems = repos.filter(repo => repo.is_recommended).map(image => <ImageCard key={image.namespace + '/' + image.name} image={image} />);

      let recommendedResults = recommendedItems.length ? (
        <div>
          <h4>Recommended</h4>
          <div className="result-grid">
            {recommendedItems}
          </div>
        </div>
      ) : null;

      let userRepoItems = repos.filter(repo => repo.is_user_repo).map(image => <ImageCard key={image.namespace + '/' + image.name} image={image} />);
      let userRepoResults = userRepoItems.length ? (
        <div>
          <h4>My Repositories</h4>
          <div className="result-grid">
            {userRepoItems}
          </div>
        </div>
      ) : null;

      let otherResults = this.state.otherItems.length ? (
        <div>
          <h4>Other Repositories</h4>
          <InfiniteGrid ref="itemGrid"
                        parentComp={this}
                        height={170}
                        width={340}
                        entries={this.state.otherItems.map(image => <ImageCard key={image.namespace + '/' + image.name} image={image} />)}
                        maxEntries={this.state.maxResults}
                        lazyCallback={this.handleInfiniteLoad}/>
        </div>
      ) : null;

      results = (
        <div className="result-grids" ref="parentGrid" onScroll={this.handleScroll}>
          {recommendedResults}
          {userRepoResults}
          {otherResults}
        </div>
      );
    } else {
      if (this.state.query.length) {
        results = (
          <div className="no-results">
            <h2>Cannot find a matching image.</h2>
          </div>
        );
      } else {
        results = (
          <div className="no-results">
            <h2>No Images</h2>
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

    return (
      <div className="details">
        <div className="new-container">
          <div className="new-container-header">
            <div className="text">
              Select a Docker image to create a container.
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
              <span className={`results-filter results-all tab ${filter === 'all' ? 'active' : ''}`} onClick={this.handleFilter.bind(this, 'all')}>All</span>
              <span className={`results-filter results-recommended tab ${filter === 'recommended' ? 'active' : ''}`} onClick={this.handleFilter.bind(this, 'recommended')}>Recommended</span>
              <span className={`results-filter results-userrepos tab ${filter === 'userrepos' ? 'active' : ''}`} onClick={this.handleFilter.bind(this, 'userrepos')}>My Repositories</span>
            </div>
            {results}
          </div>
        </div>
      </div>
    );
  }
});
