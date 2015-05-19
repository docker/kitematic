import alt from '../alt';
import router from '../router';


class AccountServerActions {
  constructor () {
    this.generateActions(
      'errors'
    );
  }

  loggedin ({username, verified}) {
    console.log(username, verified);
    router.get().goBack();
    this.dispatch({username, verified});
  }

  signedup ({username}) {
    router.get().transitionTo('search');
    this.dispatch({username});
  }
}

export default alt.createActions(AccountServerActions);
