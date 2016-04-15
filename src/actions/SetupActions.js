import alt from '../alt';
import setupUtil from '../utils/SetupUtil';

class SetupActions {
  retry (removeVM) {
    this.dispatch({removeVM});
    setupUtil.retry(removeVM);
  }

  useVbox () {
    this.dispatch({});
    setupUtil.useVbox();
  }
}

export default alt.createActions(SetupActions);
