import alt from '../alt';
import setupActions from '../actions/SetupActions';

class SetupStore {
  constructor () {
    this.bindActions(setupActions);
    this.title = '';
    this.message = '';
    this.percent = 0;
    this.error = null;
  }

  error ({error}) {
    this.setState({error});
  }

  progress ({progress}) {
    this.setState({progress})
  }
}

export default alt.createStore(SetupStore);
