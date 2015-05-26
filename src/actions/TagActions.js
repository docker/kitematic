import alt from '../alt';
import regHubUtil from '../utils/RegHubUtil';

class TagActions {
  tags (repo) {
    this.dispatch({repo});
    regHubUtil.tags(repo);
  }
}

export default alt.createActions(TagActions);
