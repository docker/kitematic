import alt from '../alt';

class SetupServerActions {
  constructor () {
    this.generateActions(
      'progress',
      'error',
      'started'
    );
  }
}

export default alt.createActions(SetupServerActions);
