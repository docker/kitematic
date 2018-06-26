import alt from "../renderer/alt";

class RepositoryServerActions {
  constructor() {
	  (this as any).generateActions(
		"reposLoading",
		"resultsUpdated",
		"recommendedUpdated",
		"reposUpdated",
		"error",
	);
  }
}

export default alt.createActions(RepositoryServerActions);
