import alt from "../renderer/alt";
import setupUtil from "../utils/SetupUtil";
class SetupActions {
    retry(removeVM) {
        this.dispatch({ removeVM });
        setupUtil.retry(removeVM);
    }
    useVbox() {
        this.dispatch({});
        setupUtil.useVbox();
    }
}
export default alt.createActions(SetupActions);
//# sourceMappingURL=SetupActions.js.map