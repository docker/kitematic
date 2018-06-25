import alt from "../alt";
import regHubUtil from "../utils/RegHubUtil";

class RepositoryActions {

	public recommended() {
		regHubUtil.recommended();
		return {};
	}

	public search(query, page = 1) {
		regHubUtil.search(query, page);
		return {query, page};
	}

	public repos() {
		regHubUtil.repos();
		return {};
	}

}

export default alt.createActions(RepositoryActions);
