import alt from "../alt";
import regHubUtil from "../utils/RegHubUtil";

class RepositoryActions {

	public recommended() {
		(this as any).dispatch({});
		regHubUtil.recommended();
	}

	public search(query, page = 1) {
		(this as any).dispatch({query, page});
		regHubUtil.search(query, page);
	}

	public repos() {
		(this as any).dispatch({});
		regHubUtil.repos();
	}

}

export default alt.createActions(RepositoryActions as any);
