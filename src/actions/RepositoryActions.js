import alt from '../alt';
import regHubUtil from '../utils/RegHubUtil';

class RepositoryActions {
  recommended () {
    this.dispatch({});
    regHubUtil.recommended();
  }

  search (query, page = 1) {
    this.dispatch({query, page});
    regHubUtil.search(query, page);
  }

  repos () {
    this.dispatch({});
    regHubUtil.repos();
  }

  fetch (name) {
    this.dispatch({});
    regHubUtil.fetch(name)
  }

  setPending (name) {
    this.dispatch({});
    regHubUtil.pending(name);
  }

  fetchPending () {
    this.dispatch({});
    let name = regHubUtil.pending();
    if (name) {
      regHubUtil.fetch(name);
    }
  }
}

export default alt.createActions(RepositoryActions);
