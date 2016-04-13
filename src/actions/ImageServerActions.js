import alt from '../alt';

class ImageServerActions {
  constructor () {
    this.generateActions(
      'added',
      'updated',
      'destroyed',
      'error'
    );
  }
}

export default alt.createActions(ImageServerActions);
