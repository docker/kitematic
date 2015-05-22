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

  search () {
    this.setState({error: null, resultsLoading: true});
  }

  resultsUpdated ({repos}) {
    this.setState({results: repos, resultsLoading: false});
  }

  recommended () {
    this.setState({error: null, recommendedLoading: true});
  }

  recommendedUpdated ({repos}) {
    this.setState({recommended: repos, recommendedLoading: false});
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
