import alt from '../alt';

class RepositoryServerActions {
  constructor () {
    this.generateActions(
      'searched',
      'fetched',
      'error'
    );
  }
}

export default alt.createActions(RepositoryServerActions);
