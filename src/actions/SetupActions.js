import alt from '../alt';
import setupUtil from '../utils/SetupUtil';

class SetupActions {
  retry (removeVM) {
    this.dispatch({removeVM});
    setupUtil.retry(removeVM);
  }
}

export default alt.createActions(SetupActions);
