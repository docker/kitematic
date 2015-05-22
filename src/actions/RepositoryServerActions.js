import alt from '../alt';

class RepositoryServerActions {
  constructor () {
    this.generateActions(
      'reposLoading',
      'resultsUpdated',
      'recommendedUpdated',
      'reposUpdated'
    );
  }
}

export default alt.createActions(RepositoryServerActions);
