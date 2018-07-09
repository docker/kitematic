import alt from "../renderer/alt";

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
