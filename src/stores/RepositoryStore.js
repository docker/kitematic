import _ from 'underscore';
import alt from '../alt';
import repositoryServerActions from '../actions/RepositoryServerActions';
import repositoryActions from '../actions/RepositoryActions';
import accountServerActions from '../actions/AccountServerActions';
import accountStore from './AccountStore';

class RepositoryStore {
  constructor () {
    this.bindActions(repositoryActions);
    this.bindActions(repositoryServerActions);
    this.bindActions(accountServerActions);
    this.results = [];
    this.recommended = [];
    this.repos = [];
    this.query = null;
    this.nextPage = null;
    this.previousPage = null;
    this.currentPage = 1;
    this.totalPage = null;
    this.reposLoading = false;
    this.recommendedLoading = false;
    this.resultsLoading = false;
    this.error = null;
  }

  error ({error}) {
    this.setState({error: error, reposLoading: false, recommendedLoading: false, resultsLoading: false});
  }

  repos () {
    this.setState({reposError: null, reposLoading: true});
  }

  reposLoading () {
    this.setState({reposLoading: true});
  }

  reposUpdated ({repos}) {
    let accountState = accountStore.getState();

    if (accountState.username && accountState.verified) {
      this.setState({repos, reposLoading: false});
    } else {
      this.setState({repos: [], reposLoading: false});
    }
  }

  search ({query, page}) {
    if (this.query === query) {
      let previousPage = (page - 1 < 1) ? 1 : page - 1;
      let nextPage = (page + 1 > this.totalPage) ? this.totalPage : page + 1;
      this.setState({query: query, error: null, resultsLoading: true, currentPage: page, nextPage: nextPage, previousPage: previousPage});
    } else {
      this.setState({query: query, error: null, resultsLoading: true, nextPage: null, previousPage: null, currentPage: 1, totalPage: null});
    }
  }

  resultsUpdated ({repos, page, previous, next, total}) {
    this.setState({results: repos, currentPage: page, previousPage: previous, nextPage: next, totalPage: total, resultsLoading: false});
  }

  recommended () {
    this.setState({error: null, recommendedLoading: true});
  }

  recommendedUpdated ({repos}) {
    this.setState({recommended: repos, recommendedLoading: false, error: null});
  }

  loggedout () {
    this.setState({repos: []});
  }

  static all () {
    let state = this.getState();
    let all = state.recommended.concat(state.repos).concat(state.results);
    return _.uniq(all, false, repo => repo.namespace + '/' + repo.name);
  }

  static loading () {
    let state = this.getState();
    return state.recommendedLoading || state.resultsLoading || state.reposLoading;
  }
}

export default alt.createStore(RepositoryStore);
