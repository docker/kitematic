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
}

export default alt.createActions(RepositoryActions);
