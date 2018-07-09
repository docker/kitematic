import setupActions from "../../actions/SetupActions";
import setupServerActions from "../../actions/SetupServerActions";
import alt from "../alt";

class SetupStore {

	public constructor() {
		(this as any).bindActions(setupActions);
		(this as any).bindActions(setupServerActions);
		(this as any).started = false;
		(this as any).progress = null;
		(this as any).error = null;
	}

	public started({started}) {
		(this as any).setState({error: null, started});
	}

	public error({error}) {
		(this as any).setState({error, progress: null});
	}

	public progress({progress}) {
		(this as any).setState({progress});
	}

}

export default alt.createStore(SetupStore);
