import alt from '../alt';

class LogActions {
  search(searchText) {
    this.dispatch({searchText});
  }

  toggleSearchField(searchFieldVisible) {
    this.dispatch({searchFieldVisible});
  }

  highlight(currentHighlighted) {
    this.dispatch({currentHighlighted});
  }
}

export default alt.createActions(LogActions);
