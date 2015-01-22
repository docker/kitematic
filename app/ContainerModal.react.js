var async = require('async');
var $ = require('jquery');
var React = require('react');
var Modal = require('react-bootstrap/Modal');
var RetinaImage = require('react-retina-image');
var ContainerStore = require('./ContainerStore');

var ContainerModal = React.createClass({
  _searchRequest: null,
  getInitialState: function () {
    return {
      query: '',
      results: [],
      recommended: ContainerStore.recommended()
    };
  },
  componentDidMount: function () {
    this.refs.searchInput.getDOMNode().focus();
  },
  search: function (query) {
    var self = this;
    this._searchRequest = $.get('https://registry.hub.docker.com/v1/search?q=' + query, function (result) {
      self._searchRequest.abort();
      self._searchRequest = null;
      if (self.isMounted()) {
        self.setState(result);
        console.log(result);
      }
    });
  },
  handleChange: function (e) {
    var query = e.target.value;

    if (query === this.state.query) {
      return;
    }

    if (this._searchRequest) {
      console.log('Cancel');
      this._searchRequest.abort();
      this._searchRequest = null;
    }
    clearTimeout(this.timeout);
    var self = this;
    this.timeout = setTimeout(function () {
      self.search(query);
    }, 250);
  },
  handleClick: function (event) {
    var name = event.target.getAttribute('name');
    var self = this;
    ContainerStore.create(name, 'latest', function (err, containerName) {
      require('./router').transitionTo('container', {name: containerName});
      self.props.onRequestHide();
    }.bind(this));
  },
  render: function () {
    var self = this;

    var data;
    if (this.state.query) {
      data = this.state.results.splice(0, 7);
    } else {
      data = this.state.recommended;
    }
    var results = data.map(function (r) {
      var name;
      if (r.is_official) {
        name = <span><RetinaImage src="official.png"/>{r.name}</span>;
      } else {
        name = <span>{r.name}</span>;
      }
      return (
        <li key={r.name}>
          <div className="info">
            <div className="name">
              {name}
            </div>
            <div className="stars">
              <div className="icon icon-star-9"></div>
              <div className="star-count">{r.star_count}</div>
            </div>
          </div>
          <div className="action">
            <button className="btn btn-primary" name={r.name} onClick={self.handleClick}>Create</button>
          </div>
        </li>
      );
    });

    var title;
    if (this.state.query) {
      title = <div className="title">Results</div>;
    } else {
      title = <div className="title">Recommended</div>;
    }

    return (
      <Modal {...this.props} animation={false} className="create-modal">
        <div className="modal-body">
          <section className="search">
            <input type="search" ref="searchInput" className="form-control" placeholder="Find an existing image" onChange={this.handleChange}/>
            <div className="question">
              <a href="#"><span>What&#39;s an image?</span></a>
            </div>
            <div className="results">
              {title}
              <ul>
                {results}
              </ul>
            </div>
          </section>
          <aside className="custom">
            <div className="title">Create a Custom Container</div>
          </aside>
        </div>
      </Modal>
    );
  }
});

module.exports = ContainerModal;
