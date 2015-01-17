var React = require('react');
var Router = require('react-router');
var Modal = require('react-bootstrap/Modal');
var RetinaImage = require('react-retina-image');
var $ = require('jquery');
var ContainerStore = require('./ContainerStore.js');

var ContainerModal = React.createClass({
  getInitialState: function () {
    return {
      query: '',
      results: []
    };
  },
  componentDidMount: function () {
    this.refs.searchInput.getDOMNode().focus();
  },
  search: function (query) {
    var self = this;
    $.get('https://registry.hub.docker.com/v1/search?q=' + query, function (result) {
      self.setState(result);
      console.log(result);
    });
  },
  handleChange: function (e) {
    var query = e.target.value;

    if (query === this.state.query) {
      return;
    }

    clearTimeout(this.timeout);
    var self = this;
    this.timeout = setTimeout(function () {
      self.search(query);
    }, 250);
  },
  handleClick: function (event) {
    var name = event.target.getAttribute('name');
    ContainerStore.create(name);
  },
  render: function () {
    var top = this.state.results.splice(0, 7);
    var self = this;
    var results = top.map(function (r) {
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
    return (
      <Modal {...this.props} animation={false} className="create-modal">
        <div className="modal-body">
          <section className="search">
            <input type="search" ref="searchInput" className="form-control" placeholder="Find an existing image" onChange={this.handleChange}/>
            <div className="question">
              <a href="#"><span>What&#39;s an image?</span></a>
            </div>
            <div className="results">
              <div className="title">Results</div>
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
