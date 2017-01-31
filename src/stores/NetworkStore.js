import alt from '../alt';
import networkActions from '../actions/NetworkActions';

class NetworkStore {
  constructor () {
    this.bindActions(networkActions);
    this.networks = [];
    this.pending = null;
    this.error = null;
  }

  error (error) {
    this.setState({error: error});
  }

  updated (networks) {
    this.setState({error: null, networks: networks});
  }

  pending () {
    this.setState({pending: true});
  }

  clearPending () {
    this.setState({pending: null});
  }

  static all () {
    let state = this.getState();
    return state.networks;
  }
}

export default alt.createStore(NetworkStore);
