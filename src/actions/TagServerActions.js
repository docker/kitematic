import alt from '../alt';

class TagServerActions {
  constructor () {
    this.generateActions(
      'tagsUpdated',
      'error'
    );
  }
}

export default alt.createActions(TagServerActions);
