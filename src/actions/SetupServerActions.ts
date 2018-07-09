import alt from "../renderer/alt";

class SetupServerActions {
	constructor() {
		(this as any).generateActions(
			"progress",
			"error",
			"started",
		);
	}
}

export default alt.createActions(SetupServerActions);
