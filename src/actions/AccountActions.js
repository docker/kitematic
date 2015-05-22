import alt from '../alt';
import hub from '../utils/HubUtil';

class AccountActions {
  login (username, password) {
    this.dispatch({});
    hub.login(username, password);
  }

  signup (username, password, email, subscribe) {
    this.dispatch({});
    hub.signup(username, password, email, subscribe);
  }

  logout () {
    this.dispatch({});
    hub.logout();
  }

  skip () {
    this.dispatch({});
    hub.prompted(true);
  }

  verify () {
    this.dispatch({});
    hub.verify();
  }
}

export default alt.createActions(AccountActions);
