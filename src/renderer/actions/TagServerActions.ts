import alt from "../alt";

class TagServerActions {
	constructor() {
		(this as any).generateActions(
			"tagsUpdated",
			"error",
		);
	}
}

export default alt.createActions(TagServerActions);
