import alt from '../renderer/alt';

class NetworkActions {
  constructor () {
    this.generateActions(
      'updated',
      'error',
      'pending',
      'clearPending'
    );
  }
}

export default alt.createActions(NetworkActions);
