import alt from '../alt';
import setupServerActions from '../actions/SetupServerActions';
import setupActions from '../actions/SetupActions';

class SetupStore {
  constructor () {
    this.bindActions(setupActions);
    this.bindActions(setupServerActions);
    this.started = false;
    this.progress = null;
    this.error = null;
  }

  started ({started}) {
    this.setState({error: null, started});
  }

  error ({error}) {
    this.setState({error, progress: null});
  }

  progress ({progress}) {
    this.setState({progress});
  }
}

export default alt.createStore(SetupStore);
