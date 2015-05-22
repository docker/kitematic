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

    // maps 'namespace/name' => true / false
    this.loading = {};
  }

  tags ({repo}) {
    this.loading[repo] = true;
    this.emitChange();
  }

  tagsUpdated ({repo, tags}) {
    this.tags[repo] = tags;
    this.loading[repo] = false;
    this.emitChange();
  }

  remove ({repo}) {
    delete this.tags[repo];
    delete this.loading[repo];
    this.emitChange();
  }

  loggedout () {
    this.loading = {};
    this.tags = {};
    this.emitChange();
  }
}

export default alt.createStore(TagStore);
