import alt from '../alt';
import logActions from '../actions/LogActions';

class LogStore {
  constructor () {
    this.bindActions(logActions);
    this.searchText = null;
    this.currentHighlighted = 1;
  }

  search ({searchText}) {
    this.setState({searchText});
  }

  toggleSearchField({searchFieldVisible}) {
    this.setState({searchFieldVisible});
  }

  highlight({currentHighlighted}) {
    this.setState({currentHighlighted});
  }
}

export default alt.createStore(LogStore);
