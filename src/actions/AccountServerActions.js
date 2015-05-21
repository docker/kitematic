import alt from '../alt';
import router from '../router';


class AccountServerActions {
  constructor () {
    this.generateActions(
      'loggedout',
      'prompted',
      'errors'
    );
  }

  loggedin ({username, verified}) {
    if (router.get()) {
      router.get().goBack();
    }
    this.dispatch({username, verified});
  }

  signedup ({username}) {
    router.get().transitionTo('search');
    this.dispatch({username});
  }
}

export default alt.createActions(AccountServerActions);
