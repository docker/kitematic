import alt from '../alt';

class TagServerActions {
  constructor () {
    this.generateActions(
      'tagsUpdated'
    );
  }
}

export default alt.createActions(TagServerActions);
