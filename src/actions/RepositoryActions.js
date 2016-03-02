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
}

export default alt.createActions(RepositoryActions);
