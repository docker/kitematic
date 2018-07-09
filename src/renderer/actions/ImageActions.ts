import dockerUtil from "../../utils/DockerUtil";
import alt from "../alt";

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
