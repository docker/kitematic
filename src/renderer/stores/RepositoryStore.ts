import _ from "underscore";
import accountServerActions from "../actions/AccountServerActions";
import repositoryActions from "../actions/RepositoryActions";
import repositoryServerActions from "../actions/RepositoryServerActions";
import alt from "../alt";
import accountStore from "./AccountStore";

class RepositoryStore {

	public static all() {
		let state = (this as any).getState();
		let all = state.recommended.concat(state.repos).concat(state.results);
		return _.uniq(all, false, (repo) => repo.namespace + "/" + repo.name);
	}

	public static loading() {
		let state = (this as any).getState();
		return state.recommendedLoading || state.resultsLoading || state.reposLoading;
	}

	public constructor() {
		(this as any).bindActions(repositoryActions);
		(this as any).bindActions(repositoryServerActions);
		(this as any).bindActions(accountServerActions);
		(this as any).results = [];
		(this as any).recommended = [];
		(this as any).repos = [];
		(this as any).query = null;
		(this as any).nextPage = null;
		(this as any).previousPage = null;
		(this as any).currentPage = 1;
		(this as any).totalPage = null;
		(this as any).reposLoading = false;
		(this as any).recommendedLoading = false;
		(this as any).resultsLoading = false;
		(this as any).error = null;
	}

	public error({error}) {
		(this as any).setState({error, reposLoading: false, recommendedLoading: false, resultsLoading: false});
	}

	public repos() {
		(this as any).setState({reposError: null, reposLoading: true});
	}

	public reposLoading() {
		(this as any).setState({reposLoading: true});
	}

	public reposUpdated({repos}) {
		let accountState = accountStore.getState();

		if (accountState.username && accountState.verified) {
			(this as any).setState({repos, reposLoading: false});
		} else {
			(this as any).setState({repos: [], reposLoading: false});
		}
	}

	public search({query, page}) {
		if ((this as any).query === query) {
			let previousPage = (page - 1 < 1) ? 1 : page - 1;
			let nextPage = (page + 1 > (this as any).totalPage) ? (this as any).totalPage : page + 1;
			(this as any).setState({query, error: null, resultsLoading: true, currentPage: page, nextPage, previousPage});
		} else {
			(this as any).setState({query, error: null, resultsLoading: true, nextPage: null, previousPage: null, currentPage: 1, totalPage: null});
		}
	}

	public resultsUpdated({repos, page, previous, next, total}) {
		(this as any).setState({results: repos, currentPage: page, previousPage: previous, nextPage: next, totalPage: total, resultsLoading: false});
	}

	public recommended() {
		(this as any).setState({error: null, recommendedLoading: true});
	}

	public recommendedUpdated({repos}) {
		(this as any).setState({recommended: repos, recommendedLoading: false});
	}

	public loggedout() {
		(this as any).setState({repos: []});
	}

}

export default alt.createStore(RepositoryStore);
