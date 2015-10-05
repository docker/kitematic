import alt from '../alt';

class SetupActions {
  constructor () {
    this.generateActions(
      'progress',
      'error'
    );
  }
}

export default alt.createActions(SetupActions);
