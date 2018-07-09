import regHubUtil from "../../utils/RegHubUtil";
import alt from "../alt";

class TagActions {
	public tags(repo) {
		(this as any).dispatch({repo});
		regHubUtil.tags(repo);
	}

	public localTags(repo, tags) {
		(this as any).dispatch({repo, tags});
	}
}

export default alt.createActions(TagActions);
