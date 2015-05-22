import alt from '../alt';
import router from '../router';

class AccountServerActions {
  constructor () {
    this.generateActions(
      'loggedout',
      'prompted',
      'errors',
      'verified'
    );
  }

  loggedin ({username, verified}) {
    if (router.get()) {
      router.get().goBack();
    }
    this.dispatch({username, verified});
  }

  signedup ({username}) {
    if (router.get()) {
      router.get().goBack();
    }
    this.dispatch({username});
  }
}

export default alt.createActions(AccountServerActions);
