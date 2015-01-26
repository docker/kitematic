var async = require('async');
var $ = require('jquery');
var React = require('react/addons');
var Modal = require('react-bootstrap/Modal');
var RetinaImage = require('react-retina-image');
var ContainerStore = require('./ContainerStore');
var OverlayTrigger = require('react-bootstrap/OverlayTrigger');
var Popover = require('react-bootstrap/Popover');

var ContainerModal = React.createClass({
  _searchRequest: null,
  getInitialState: function () {
    return {
      query: '',
      results: ContainerStore.recommended(),
      loading: false,
    };
  },
  componentDidMount: function () {
    this.refs.searchInput.getDOMNode().focus();
    ContainerStore.on(ContainerStore.SERVER_RECOMMENDED_EVENT, this.update);
  },
  update: function () {
    if (!this.state.query.length) {
      this.setState({
        results: ContainerStore.recommended()
      });
    }
  },
  search: function (query) {
    if (this._searchRequest) {
      this._searchRequest.abort();
      this._searchRequest = null;
    }

    this.setState({
      loading: true
    });

    var self = this;
    this._searchRequest = $.get('https://registry.hub.docker.com/v1/search?q=' + query, function (result) {
      self.setState({
        query: query,
        loading: false
      });
      self._searchRequest = null;
      if (self.isMounted()) {
        self.setState(result);
      }
    });
  },
  handleChange: function (e) {
    var query = e.target.value;

    if (query === this.state.query) {
      return;
    }

    clearTimeout(this.timeout);
    if (!query.length) {
      this.setState({
        query: query,
        results: ContainerStore.recommended()
      });
    } else {
      var self = this;
      this.timeout = setTimeout(function () {
        self.search(query);
      }, 200);
    }
  },
  handleClick: function (event) {
    var name = event.target.getAttribute('name');
    var self = this;
    ContainerStore.create(name, 'latest', function (err, containerName) {
      self.props.onRequestHide();
    });
  },
  render: function () {
    var self = this;
    var data = this.state.results.slice(0, 7);

    var results;
    if (data.length) {
      var items = data.map(function (r) {
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
              <div className="properties">
                <div className="icon icon-star-9"></div>
                <div className="star-count">{r.star_count}</div>
              </div>
            </div>
            <div className="action">
              <div className="btn-group">
                <a className="btn btn-action" name={r.name} onClick={self.handleClick}>Create</a>
                <a className="btn btn-action with-icon dropdown-toggle"><span className="icon-dropdown icon icon-arrow-37"></span></a>
              </div>
            </div>
          </li>
        );
      });

      results = (
        <div className="result-list">
          <ul>
            {items}
          </ul>
        </div>
      );
    } else {
      results = (
        <div className="no-results">
          <h3>
            No Results
          </h3>
        </div>
      );
    }

    var title = this.state.query ? 'Results' : 'Recommended';
    var loadingClasses = React.addons.classSet({
      hidden: !this.state.loading,
      loading: true
    });
    var magnifierClasses = React.addons.classSet({
      hidden: this.state.loading,
      icon: true,
      'icon-magnifier': true,
      'search-icon': true
    });

    return (
      <Modal {...this.props} animation={false} className="create-modal">
        <div className="modal-body">
          <section className="search">
            <div className="search-bar">
              <input type="search" ref="searchInput" className="form-control" placeholder="Find an existing image" onChange={this.handleChange}/>
              <div className={magnifierClasses}></div>
              <RetinaImage className={loadingClasses} src="loading.png"/>
            </div>
            <div className="question">
              <OverlayTrigger trigger="hover" placement="bottom" overlay={<Popover>An image is a template which a container can be created from.</Popover>}>
                <a><span>What&#39;s an image?</span></a>
              </OverlayTrigger>
            </div>
            <div className="results">
              <div className="title">{title}</div>
              {results}
            </div>
          </section>
          <aside className="custom">
            <h4 className="title">Create a Custom Container</h4>
          </aside>
        </div>
      </Modal>
    );
  }
});

module.exports = ContainerModal;
