import alt from '../alt';

class AccountServerActions {
  constructor () {
    this.generateActions(
      'signedup',
      'loggedin',
      'loggedout',
      'prompted',
      'errors',
      'verified'
    );
  }
}

export default alt.createActions(AccountServerActions);
