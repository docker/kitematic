import alt from '../alt';
import dockerUtil from '../utils/DockerUtil';

class ImageActions {

  all () {
    this.dispatch({});
    dockerUtil.fetchAllImages();
  }

  destroy (image) {
    dockerUtil.removeImage(image);
  }
}

export default alt.createActions(ImageActions);
