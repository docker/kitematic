import alt from "../alt";

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
