import alt from '../alt';
import router from '../router';


class AccountServerActions {
  constructor () {
    this.generateActions(
      'loggedin',
      'errors'
    );
  }

  signedup ({username, verified}) {
    router.get().transitionTo('search');
    this.dispatch({username, verified});
  }
}

export default alt.createActions(AccountServerActions);
