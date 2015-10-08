import alt from '../alt';

class SetupServerActions {
  constructor () {
    this.generateActions(
      'progress',
      'error'
    );
  }
}

export default alt.createActions(SetupServerActions);
