import alt from '../alt';

class RepositoryServerActions {
  constructor () {
    this.generateActions(
      'reposLoading',
      'resultsUpdated',
      'recommendedUpdated',
      'reposUpdated',
      'error',
      'fetch'
    );
  }
}

export default alt.createActions(RepositoryServerActions);
