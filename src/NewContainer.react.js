var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var RetinaImage = require('react-retina-image');
var ContainerStore = require('./ContainerStore');
var Radial = require('./Radial.react');
var assign = require('object-assign');
var Promise = require('bluebird');

var _recommended = [];

var NewContainer = React.createClass({
  _searchRequest: null,
  getInitialState: function () {
    return {
      query: '',
      results: _recommended,
      loading: false,
      tags: {},
      active: null,
      creating: []
    };
  },
  componentDidMount: function () {
    this.setState({
      creating: []
    });
    this.refs.searchInput.getDOMNode().focus();
    if (!_recommended.length) {
      this.recommended();
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
  recommended: function () {
    if (this._searchRequest) {
      this._searchRequest.abort();
      this._searchRequest = null;
    }

    if (_recommended.length) {
      return;
    }
    Promise.resolve($.ajax({
      url: 'https://kitematic.com/recommended.json',
      cache: false,
      dataType: 'json',
    })).then(res => res.repos).map(repo => {
      return $.get('https://registry.hub.docker.com/v1/search?q=' + repo.repo).then(data => {
        var results = data.results;
        var result = _.find(results, function (r) {
          return r.name === repo.repo;
        });
        return _.extend(result, repo);
      });
    }).then(results => {
      _recommended = results.filter(r => !!r);
      if (!this.state.query.length) {
        if (this.isMounted()) {
          this.setState({
            results: _recommended
          });
        }
      }
    }).catch(err => {
      console.log(err);
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
        results: _recommended
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
      $(document.body).find('.new-container-item').parent().fadeOut();
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
    var data = [];
    if (this.state.results) {
      data = this.state.results.slice(0, 6);
    }
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
        var imgsrc;
        if (r.img) {
          imgsrc = `http://kitematic.com/recommended/${r.img}`;
        } else {
          imgsrc = 'http://kitematic.com/recommended/kitematic_html.png';
        }
        var action;
        if (_.find(self.state.creating, r.name)) {
          action = <RetinaImage src="loading.png"/>;
        } else {
          action = <a className="btn btn-action" onClick={self.handleClick.bind(self, r.name)}>Create</a>;
        }
        return (
          <div key={r.name} className="image-item">
            <div className="logo" style={logoStyle}>
              <RetinaImage src={imgsrc}/>
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
                  {action}
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
      if (this.state.results.length === 0 && this.state.query === '') {
        results = (
          <div className="no-results">
            <div className="loader">
              <h2>Loading Images</h2>
              <Radial spin="true" progress={90} thick={true} transparent={true} />
            </div>
          </div>
        );
      } else {
        results = (
          <div className="no-results">
            <h1>Cannot find a matching image.</h1>
          </div>
        );
      }
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
        <div className="new-container">
          <div className="new-container-header">
            <div className="text">
              Select an image to create a new container.
            </div>
            <div className="search">
              <div className="search-bar">
                <input type="search" ref="searchInput" className="form-control" placeholder="Find an image from Docker Hub" onChange={this.handleChange}/>
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
    );
  }
});

module.exports = NewContainer;
