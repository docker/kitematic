import accountActions from "../../actions/AccountActions";
import accountServerActions from "../../actions/AccountServerActions";
import alt from "../../alt";

class AccountStore {
	constructor() {
		(this as any).bindActions(accountServerActions);
		(this as any).bindActions(accountActions);

		(this as any).prompted = false;
		(this as any).loading = false;
		(this as any).errors = {};

		(this as any).verified = false;
		(this as any).username = null;
	}

	public skip() {
		(this as any).setState({
			prompted: true,
		});
	}

	public login() {
		(this as any).setState({
			loading: true,
			errors: {},
		});
	}

	public logout() {
		(this as any).setState({
			loading: false,
			errors: {},
			username: null,
			verified: false,
		});
	}

	public signup() {
		(this as any).setState({
			loading: true,
			errors: {},
		});
	}

	public loggedin({username, verified}) {
		(this as any).setState({username, verified, errors: {}, loading: false});
	}

	public loggedout() {
		(this as any).setState({
			loading: false,
			errors: {},
			username: null,
			verified: false,
		});
	}

	public signedup({username}) {
		(this as any).setState({username, errors: {}, loading: false});
	}

	public verify() {
		(this as any).setState({loading: true});
	}

	public verified({verified}) {
		(this as any).setState({verified, loading: false});
	}

	public prompted({prompted}) {
		(this as any).setState({prompted});
	}

	public errors({errors}) {
		(this as any).setState({errors, loading: false});
	}
}

export default alt.createStore(AccountStore);
