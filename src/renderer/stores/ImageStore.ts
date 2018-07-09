import imageActions from "../actions/ImageActions";
import imageServerActions from "../actions/ImageServerActions";
import alt from "../alt";

class ImageStore {

	public static all() {
		let state = (this as any).getState();
		return state.images;
	}

	public constructor() {
		(this as any).bindActions(imageActions);
		(this as any).bindActions(imageServerActions);
		(this as any).results = [];
		(this as any).images = [];
		(this as any).imagesLoading = false;
		(this as any).resultsLoading = false;
		(this as any).error = null;
	}

	public error(error) {
		(this as any).setState({error, imagesLoading: false, resultsLoading: false});
	}

	public clearError() {
		(this as any).setState({error: null});
	}

	public destroyed(data) {
		let images = (this as any).images;
		if ((data && data[1] && data[1].Deleted)) {
			delete images[data[1].Deleted];
		}
		(this as any).setState({error: null});
	}

	public updated(images) {
		let tags = {};
		let finalImages = [];
		images.map((image) => {
			if (image.RepoTags) {
				image.RepoTags.map((repoTags) => {
					let [name, tag] = repoTags.split(":");
					if (typeof tags[name] !== "undefined") {
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
		(this as any).setState({error: null, images: finalImages, imagesLoading: false});
	}

}

export default alt.createStore(ImageStore);
