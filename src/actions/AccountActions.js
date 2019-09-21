import alt from '../alt';
import hub from '../utils/HubUtil';

class AccountActions {
  login (username, password) {
    this.dispatch({});
    hub.login(username, password);
  }

  logout () {
    this.dispatch({});
    hub.logout();
  }

  skip () {
    this.dispatch({});
    hub.setPrompted(true);
  }

  verify () {
    this.dispatch({});
    hub.verify();
  }
}

export default alt.createActions(AccountActions);
