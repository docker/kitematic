import alt from '../alt';
import regHubUtil from '../utils/RegHubUtil';

class RepositoryActions {
  recommended () {
    this.dispatch({});
    regHubUtil.recommended();
  }

  search (query) {
    this.dispatch({});
    regHubUtil.search(query);
  }

  repos () {
    this.dispatch({});
    regHubUtil.repos();
  }

  tags () {

  }
}

export default alt.createActions(RepositoryActions);
