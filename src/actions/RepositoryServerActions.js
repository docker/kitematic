import alt from "../renderer/alt";
class RepositoryServerActions {
    constructor() {
        this.generateActions("reposLoading", "resultsUpdated", "recommendedUpdated", "reposUpdated", "error");
    }
}
export default alt.createActions(RepositoryServerActions);
//# sourceMappingURL=RepositoryServerActions.js.map