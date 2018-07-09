import networkActions from "../actions/NetworkActions";
import alt from "../renderer/alt";
class NetworkStore {
    static all() {
        let state = this.getState();
        return state.networks;
    }
    constructor() {
        this.bindActions(networkActions);
        this.networks = [];
        this.pending = null;
        this.error = null;
    }
    error(error) {
        this.setState({ error });
    }
    updated(networks) {
        this.setState({ error: null, networks });
    }
    pending() {
        this.setState({ pending: true });
    }
    clearPending() {
        this.setState({ pending: null });
    }
}
export default alt.createStore(NetworkStore);
//# sourceMappingURL=NetworkStore.js.map