import alt from "../renderer/alt";

class TagServerActions {
	constructor() {
		(this as any).generateActions(
			"tagsUpdated",
			"error",
		);
	}
}

export default alt.createActions(TagServerActions);
