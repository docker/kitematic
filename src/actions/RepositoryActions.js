import alt from "../alt";
import regHubUtil from "../utils/RegHubUtil";
class RepositoryActions {
    recommended() {
        regHubUtil.recommended();
        return {};
    }
    search(query, page = 1) {
        regHubUtil.search(query, page);
        return { query, page };
    }
    repos() {
        regHubUtil.repos();
        return {};
    }
}
export default alt.createActions(RepositoryActions);
//# sourceMappingURL=RepositoryActions.js.map