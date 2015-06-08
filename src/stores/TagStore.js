import alt from '../alt';
import tagActions from '../actions/TagActions';
import tagServerActions from '../actions/TagServerActions';
import accountServerActions from '../actions/AccountServerActions';

class TagStore {
  constructor () {
    this.bindActions(tagActions);
    this.bindActions(tagServerActions);
    this.bindActions(accountServerActions);

    // maps 'namespace/name' => [list of tags]
    this.tags = {};

    this.currentRepo = null;

    // maps 'namespace/name' => true / false
    this.loading = false;
  }

  tags ({repo}) {
    this.setState({
      loading: true,
      currentRepo: repo
    });
  }

  tagsUpdated ({repo, tags}) {
    console.log("Set current repo: %o - %o", repo, this);
    this.setState({
      tags: tags,
      loading: false,
      currentRepo: repo
    });
  }

  remove ({repo}) {
    delete this.tags[repo];
    delete this.loading[repo];
    this.emitChange();
  }

  loggedout () {
    this.setState({
      loading: {},
      tags: {},
      currentRepo: null
    });
  }

  error ({repo}) {
    this.setState({
      loading: false
    });
  }
}

export default alt.createStore(TagStore);
