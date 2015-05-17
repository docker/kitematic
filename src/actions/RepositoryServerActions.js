import alt from '../alt';

class RepositoryServerActions {
  constructor () {
    this.generateActions(
      'fetched',
      'error'
    );
  }
}

export default alt.createActions(RepositoryServerActions);
