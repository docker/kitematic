import alt from '../alt';
import regHubUtil from '../utils/RegHubUtil';
import hubUtil from '../utils/HubUtil';

class TagActions {
  tags (repo) {
    this.dispatch({repo});
    regHubUtil.tags(hubUtil.jwt(), repo);
  }
}

export default alt.createActions(TagActions);
