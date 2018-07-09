import alt from "../alt";

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
