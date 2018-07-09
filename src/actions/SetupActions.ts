import alt from "../renderer/alt";
import setupUtil from "../utils/SetupUtil";

class SetupActions {

	public retry(removeVM) {
		(this as any).dispatch({removeVM});
		setupUtil.retry(removeVM);
	}

	public useVbox() {
		(this as any).dispatch({});
		setupUtil.useVbox();
	}

}

export default alt.createActions(SetupActions);
