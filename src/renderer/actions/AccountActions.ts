import alt from "../alt";
import hub from "../utils/HubUtil";

class AccountActions {

  public login(username, password) {
	  (this as any).dispatch({});
		 hub.login(username, password);
  }

  public signup(username, password, email, subscribe) {
	  (this as any).dispatch({});
	  hub.signup(username, password, email, subscribe);
  }

  public logout() {
	  (this as any).dispatch({});
	  hub.logout();
  }

  public skip() {
	  (this as any).dispatch({});
	  hub.setPrompted(true);
  }

  public verify() {
	  (this as any).dispatch({});
	  hub.verify();
  }
}

export default alt.createActions(AccountActions);
