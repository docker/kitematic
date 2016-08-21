import alt from '../alt';
import imageActions from '../actions/ImageActions';
import imageServerActions from '../actions/ImageServerActions';

class ImageStore {
  constructor () {
    this.bindActions(imageActions);
    this.bindActions(imageServerActions);
    this.results = [];
    this.images = [];
    this.imagesLoading = false;
    this.resultsLoading = false;
    this.error = null;
  }

  error (error) {
    this.setState({error: error, imagesLoading: false, resultsLoading: false});
  }

  clearError () {
    this.setState({error: null});
  }

  destroyed (data) {
    let images = this.images;
    if ((data && data[1] && data[1].Deleted)) {
      delete images[data[1].Deleted];
    }
    this.setState({error: null});
  }

  updated (images) {
    let tags = {};
    let finalImages = [];
    images.map((image) => {
      if (image.RepoTags) {
        image.RepoTags.map(repoTags => {
          let [name, tag] = repoTags.split(':');
          if (typeof tags[name] !== 'undefined') {
            finalImages[tags[name]].tags.push(tag);
            if (image.inUse) {
              finalImages[tags[name]].inUse = image.inUse;
            }
          } else {
            image.tags = [tag];
            tags[name] = finalImages.length;
            finalImages.push(image);
          }
        });
      }
    });
    this.setState({error: null, images: finalImages, imagesLoading: false});
  }

  static all () {
    let state = this.getState();
    return state.images;
  }
}

export default alt.createStore(ImageStore);
