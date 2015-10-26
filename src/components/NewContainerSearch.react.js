import _ from 'underscore';
import React from 'react/addons';
import Router from 'react-router';
import RetinaImage from 'react-retina-image';
import ImageCard from './ImageCard.react';
import Promise from 'bluebird';
import metrics from '../utils/MetricsUtil';
import classNames from 'classnames';
import repositoryActions from '../actions/RepositoryActions';
import repositoryStore from '../stores/RepositoryStore';
import accountStore from '../stores/AccountStore';
import accountActions from '../actions/AccountActions';

var _searchPromise = null;

module.exports = React.createClass({
  mixins: [Router.Navigation, Router.State],
  getInitialState: function () {
    return {
      query: '',
      loading: repositoryStore.loading(),
      repos: repositoryStore.all(),
      username: accountStore.getState().username,
      verified: accountStore.getState().verified,
      accountLoading: accountStore.getState().loading,
      error: repositoryStore.getState().error,
      currentPage: repositoryStore.getState().currentPage,
      totalPage: repositoryStore.getState().totalPage,
      previousPage: repositoryStore.getState().previousPage,
      nextPage: repositoryStore.getState().nextPage
    };
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
    this.setState({
      loading: repositoryStore.loading(),
      repos: repositoryStore.all(),
      currentPage: repositoryStore.getState().currentPage,
      totalPage: repositoryStore.getState().totalPage,
      previousPage: repositoryStore.getState().previousPage,
      nextPage: repositoryStore.getState().nextPage
    });
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

    let previousPage = (page - 1 < 1) ? 1 : page - 1;
    let nextPage = (page + 1 > this.state.totalPage) ? this.state.totalPage : page + 1;

    this.setState({
      query: query,
      loading: true,
      currentPage: page,
      previousPage: previousPage,
      nextPage: nextPage
    });

    _searchPromise = Promise.delay(200).cancellable().then(() => {
      metrics.track('Searched for Images');
      _searchPromise = null;
      repositoryActions.search(query, page);
    }).catch(Promise.CancellationError, () => {});
  },
  handleChange: function (e) {
    let query = e.target.value;
    if (query === this.state.query) {
      return;
    }
    this.search(query);
  },
  handlePage: function (page) {
    let query = this.state.query;
    this.search(query, page);
  },
  handleFilter: function (filter) {

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
  handleCheckVerification: function () {
    accountActions.verify();
    metrics.track('Verified Account', {
      from: 'search'
    });
  },
  render: function () {
    let filter = this.getQuery().filter || 'all';
    let repos = _.values(this.state.repos)
        .filter(repo => {
          if (repo.is_recommended || repo.is_user_repo) {
            return repo.name.toLowerCase().indexOf(this.state.query.toLowerCase()) !== -1 || repo.namespace.toLowerCase().indexOf(this.state.query.toLowerCase()) !== -1;
          }
          return true;
        })
        .filter(repo => filter === 'all' || (filter === 'recommended' && repo.is_recommended) || (filter === 'userrepos' && repo.is_user_repo));

    let results, paginateResults;
    let previous = [];
    let next = [];
    if (this.state.previousPage) {
      let previousPage = this.state.currentPage - 7;
      if (previousPage < 1) {
        previousPage = 1;
      }
      previous.push((
        <li>
          <a href="" onClick={this.handlePage.bind(this, 1)} aria-label="First">
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
      ));
      for (previousPage; previousPage < this.state.currentPage; previousPage++) {
        previous.push((
          <li><a href="" onClick={this.handlePage.bind(this, previousPage)}>{previousPage}</a></li>
        ));
      }
    }
    if (this.state.nextPage) {
      let nextPage = this.state.currentPage + 1;
      for (nextPage; nextPage < this.state.totalPage; nextPage++) {
        next.push((
          <li><a href="" onClick={this.handlePage.bind(this, nextPage)}>{nextPage}</a></li>
        ));
        if (nextPage > this.state.currentPage + 7) {
          break;
        }
      }
      next.push((
        <li>
          <a href="" onClick={this.handlePage.bind(this, this.state.totalPage)} aria-label="Last">
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      ));
    }

    let current = (
      <li className="active">
        <span>{this.state.currentPage} <span className="sr-only">(current)</span></span>
      </li>
    );

    paginateResults = next.length || previous.length ? (
      <nav>
        <ul className="pagination">
          {previous}
          {current}
          {next}
        </ul>
      </nav>
    ) : null;
    if (this.state.error) {
      results = (
        <div className="no-results">
          <h2>There was an error contacting Docker Hub.</h2>
        </div>
      );
      paginateResults = null;
    } else if (filter === 'userrepos' && !accountStore.getState().username) {
      results = (
        <div className="no-results">
          <h2><Router.Link to="login">Log In</Router.Link> or <Router.Link to="signup">Sign Up</Router.Link> to access your Docker Hub repositories.</h2>
          <RetinaImage src="connect-art.png" checkIfRetinaImgExists={false}/>
        </div>
      );
      paginateResults = null;
    } else if (filter === 'userrepos' && !accountStore.getState().verified) {
      let spinner = this.state.accountLoading ? <div className="spinner la-ball-clip-rotate la-dark"><div></div></div> : null;
      results = (
        <div className="no-results">
          <h2>Please verify your Docker Hub account email address</h2>
          <div className="verify">
            <button className="btn btn-action" onClick={this.handleCheckVerification}>{'I\'ve Verified My Email Address'}</button> {spinner}
          </div>
          <RetinaImage src="inspection.png" checkIfRetinaImgExists={false}/>
        </div>
      );
      paginateResults = null;
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
      let otherItems = repos.filter(repo => !repo.is_recommended && !repo.is_user_repo).map(image => <ImageCard key={image.namespace + '/' + image.name} image={image} />);

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

      let otherResults;
      if (otherItems.length) {
        otherResults = (
          <div>
            <h4>Other Repositories</h4>
            <div className="result-grid">
              {otherItems}
            </div>
          </div>
        );
      } else {
        otherResults = null;
        paginateResults = null;
      }

      results = (
        <div className="result-grids">
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
      'icon-search': true,
      'search-icon': true
    });

    return (
      <div className="details">
        <div className="new-container">
          <div className="new-container-header">
            <div className="search">
              <div className="search-bar">
                <input type="search" ref="searchInput" className="form-control" placeholder="Search for Docker images from Docker Hub" onChange={this.handleChange}/>
                <div className={magnifierClasses}></div>
                <div className={loadingClasses}><div></div></div>
              </div>
            </div>
            <div className="results-filters">
              <span className="results-filter results-filter-title">FILTER BY</span>
              <span className={`results-filter results-all tab ${filter === 'all' ? 'active' : ''}`} onClick={this.handleFilter.bind(this, 'all')}>All</span>
              <span className={`results-filter results-recommended tab ${filter === 'recommended' ? 'active' : ''}`} onClick={this.handleFilter.bind(this, 'recommended')}>Recommended</span>
              <span className={`results-filter results-userrepos tab ${filter === 'userrepos' ? 'active' : ''}`} onClick={this.handleFilter.bind(this, 'userrepos')}>My Repos</span>
            </div>
          </div>
          <div className="results">
            {results}
          </div>
          <div className="pagination-center">
            {paginateResults}
          </div>
        </div>
      </div>
    );
  }
});
