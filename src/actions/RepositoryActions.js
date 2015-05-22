import alt from '../alt';
import regHubUtil from '../utils/RegHubUtil';
import hubUtil from '../utils/HubUtil';

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
    regHubUtil.repos(hubUtil.jwt());
  }

  tags () {
    
  }
}

export default alt.createActions(RepositoryActions);
