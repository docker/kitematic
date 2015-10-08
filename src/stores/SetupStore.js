import alt from '../alt';
import setupServerActions from '../actions/SetupServerActions';
import setupActions from '../actions/SetupActions';

class SetupStore {
  constructor () {
    this.bindActions(setupActions);
    this.bindActions(setupServerActions);
    this.percent = 0;
    this.error = null;
  }

  error ({error}) {
    this.setState({error});
  }

  progress ({progress}) {
    this.setState({error: null, progress})
  }
}

export default alt.createStore(SetupStore);
