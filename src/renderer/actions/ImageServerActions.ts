import alt from "../alt";

class ImageServerActions {
	public constructor() {
		(this as any).generateActions(
			"added",
			"updated",
			"destroyed",
			"error",
		);
	}
}

export default alt.createActions(ImageServerActions);
