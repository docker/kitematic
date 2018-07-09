import networkActions from "../../actions/NetworkActions";
import alt from "../alt";

class NetworkStore {

	public static all() {
		let state = (this as any).getState();
		return state.networks;
	}

	public constructor() {
		(this as any).bindActions(networkActions);
		(this as any).networks = [];
		this.pending = null;
		this.error = null;
	}

	public error(error) {
		(this as any).setState({error});
	}

	public updated(networks) {
		(this as any).setState({error: null, networks});
	}

	public pending() {
		(this as any).setState({pending: true});
	}

	public clearPending() {
		(this as any).setState({pending: null});
	}

}

export default alt.createStore(NetworkStore);
