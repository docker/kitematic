import alt from "../renderer/alt";
import regHubUtil from "../utils/RegHubUtil";
class TagActions {
    tags(repo) {
        this.dispatch({ repo });
        regHubUtil.tags(repo);
    }
    localTags(repo, tags) {
        this.dispatch({ repo, tags });
    }
}
export default alt.createActions(TagActions);
//# sourceMappingURL=TagActions.js.map