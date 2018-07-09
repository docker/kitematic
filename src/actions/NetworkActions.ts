import alt from "../renderer/alt";

class NetworkActions {
	constructor() {
		(this as any).generateActions(
			"updated",
			"error",
			"pending",
			"clearPending",
		);
	}
}

export default alt.createActions(NetworkActions);
