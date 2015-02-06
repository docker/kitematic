var $ = require('jquery');
var React = require('react/addons');
var RetinaImage = require('react-retina-image');
var ContainerStore = require('./ContainerStore');
var assign = require('object-assign');

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
  handleClick: function (name) {
    ContainerStore.create(name, 'latest', function (err) {
      if (err) {
        throw err;
      }
    }.bind(this));
  },
  handleDropdownClick: function (name) {
    this.setState({
      active: name
    });
    if (this.state.tags[name]) {
      return;
    }
    $.get('https://registry.hub.docker.com/v1/repositories/' + name + '/tags', function (result) {
      var res = {};
      res[name] = result;
      console.log(assign(this.state.tags, res));
      this.setState({
        tags: assign(this.state.tags, res)
      });
    }.bind(this));
  },
  render: function () {
    var self = this;
    var title = this.state.query ? 'Results' : 'Recommended';
    var data = this.state.results.slice(0, 6);

    var results;
    if (data.length) {
      var items = data.map(function (r) {
        var name;
        if (r.is_official) {
          name = <span><RetinaImage src="official.png"/>{r.name}</span>;
        } else {
          name = <span>{r.name}</span>;
        }
        var description;
        if (r.description) {
          description = r.description;
        } else {
          description = "No description.";
        }
        var logoStyle = {
          backgroundImage: `linear-gradient(-180deg, ${r.gradient_start} 4%, ${r.gradient_end}  100%)`
        };
        return (
          <div key={r.name} className="image-item">
            <div className="logo" style={logoStyle}>
              <RetinaImage src={'https://kitematic.com/recommended/' + r.img}/>
            </div>
            <div className="card">
              <div className="name">
                {name}
              </div>
              <div className="description">
                {description}
              </div>
              <div className="actions">
                <div className="stars">
                  <span className="icon icon-star-9"></span>
                  <span className="text">{r.star_count}</span>
                </div>
                <div className="tags">
                  <span className="icon icon-tag-1"></span>
                  <span className="text">latest</span>
                </div>
                <div className="action">
                  <a className="btn btn-action" onClick={self.handleClick.bind(self, r.name)}>Create</a>
                </div>
              </div>
            </div>
          </div>
        );
      });

      results = (
        <div className="result-grid">
          {items}
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
            <div className="results">
              <h4>{title}</h4>
              {results}
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = NewContainer;
