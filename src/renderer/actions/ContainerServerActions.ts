import alt from "../alt";

class ContainerServerActions {
	constructor() {
		(this as any).generateActions(
			"added",
			"allUpdated",
			"destroyed",
			"error",
			"muted",
			"pending",
			"progress",
			"started",
			"unmuted",
			"updated",
			"waiting",
			"kill",
			"stopped",
			"log",
			"logs",
			"toggleFavorite",
		);
	}
}

export default alt.createActions(ContainerServerActions);
