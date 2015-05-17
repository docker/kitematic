import alt from '../alt';
import accountServerActions from '../actions/AccountServerActions';
import accountActions from '../actions/AccountActions';

class AccountStore {
  constructor () {
    this.bindActions(accountServerActions);
    this.bindActions(accountActions);

    this.prompted = localStorage.getItem('account.prompted') || false;
    this.loading = false;
    this.errors = {};

    this.verified = false;
    this.username = null;
  }

  skip () {
    this.setState({
      prompted: true
    });
    localStorage.setItem('account.prompted', true);
  }

  login () {
    this.setState({
      loading: true,
      errors: {}
    });
  }

  signup () {
    this.setState({
      loading: true,
      errors: {}
    });
  }

  loggedin ({username}) {
    this.setState({username, errors: {}, loading: false});
  }

  signedup ({username}) {
    this.setState({username, errors: {}, loading: false});
  }

  verified ({verified}) {
    this.setState({verified});
  }

  errors ({errors}) {
    console.log(errors);
    this.setState({errors, loading: false});
  }
}

export default alt.createStore(AccountStore);
