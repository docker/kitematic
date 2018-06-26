import alt from '../renderer/alt';

class TagServerActions {
  constructor () {
    this.generateActions(
      'tagsUpdated',
      'error'
    );
  }
}

export default alt.createActions(TagServerActions);
