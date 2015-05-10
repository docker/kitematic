import alt from '../alt';

class ContainerServerActions {
  constructor () {
    this.generateActions(
      'added',
      'allUpdated',
      'destroyed',
      'error',
      'muted',
      'unmuted',
      'progress',
      'pending',
      'updated',
      'waiting'
    );
  }
}

export default alt.createActions(ContainerServerActions);
