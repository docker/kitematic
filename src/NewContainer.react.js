var $ = require('jquery');
var React = require('react/addons');
var RetinaImage = require('react-retina-image');
var ContainerStore = require('./ContainerStore');

var NewContainer = React.createClass({
  _searchRequest: null,
  getInitialState: function () {
    return {
      query: '',
      results: ContainerStore.recommended(),
      loading: false,
      tags: {},
      active: null,
    };
  },
  componentDidMount: function () {
    this.refs.searchInput.getDOMNode().focus();
    ContainerStore.on(ContainerStore.CLIENT_RECOMMENDED_EVENT, this.update);
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

    if (!query.length) {
      return;
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
  render: function () {
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
      <div className="details">
        <div className="detail-panel">
          <div className="new-container">
            <div className="new-container-header">
              <div className="text">
                Pick an image to create new container.
              </div>
              <div className="search">
                <div className="search-bar">
                  <input type="search" ref="searchInput" className="form-control" placeholder="Find an existing image" onChange={this.handleChange}/>
                  <div className={magnifierClasses}></div>
                  <RetinaImage className={loadingClasses} src="loading.png"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = NewContainer;
