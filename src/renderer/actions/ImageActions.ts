import alt from "../alt";
import dockerUtil from "../utils/DockerUtil";

class ImageActions {

	public all() {
		(this as any).dispatch({});
		dockerUtil.refresh();
	}

	public destroy(image) {
		dockerUtil.removeImage(image);
	}
}

export default alt.createActions(ImageActions);
