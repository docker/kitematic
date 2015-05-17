import alt from '../alt';
import repositoryServerActions from '../actions/RepositoryServerActions';

class RepositoryStore {
  constructor () {
    this.bindActions(repositoryServerActions);
    this.repos = [];
    this.loading = false;
    this.error = null;
  }

  fetch () {
    this.setState({
      repos: [],
      error: null,
      loading: true
    });
  }

  fetched ({repos}) {
    this.setState({repos, loading: false});
  }

  error ({error}) {
    this.setState({error, loading: false});
  }
}

export default alt.createStore(RepositoryStore);
