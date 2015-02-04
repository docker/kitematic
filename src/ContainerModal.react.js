var $ = require('jquery');
var assign = require('object-assign');
var React = require('react/addons');
var Modal = require('react-bootstrap').Modal;
var OverlayTrigger = require('react-bootstrap');
var Popover = require('react-bootstrap/Popover');
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
    this.props.onRequestHide();
    ContainerStore.create(name, 'latest', function (err) {
      if (err) {
        throw err;
      }
    }.bind(this));
  },
  handleTagClick: function (tag, name) {
    this.props.onRequestHide();
    ContainerStore.create(name, tag, function () {});
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
  handleModalClick: function (event) {
    if (!this.state.active) {
      return;
    }
    if (!$('.popover').is(event.target)) {
      this.setState({
        active: null
      });
    }
  },
  componentDidUpdate: function () {
    if (!this.state.active) {
      return;
    }
    var $dropdown = $(this.getDOMNode()).find('[data-name="' + this.state.active + '"]');
    var $popover = $(this.getDOMNode()).find('.popover');

    $popover.offset({
      top: $dropdown.offset().top + 32,
      left: $dropdown.offset().left - $popover.width() / 2 + 11
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
                <button type="button" className="btn btn-primary" onClick={self.handleClick.bind(self, r.name)}>Create</button>
                <button type="button" className="btn btn-primary dropdown-toggle" onClick={self.handleDropdownClick.bind(self, r.name)} data-name={r.name}>
                  <span className="icon-dropdown icon icon-arrow-37"></span>
                </button>
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

    var question = (
      <div className="question">
        <OverlayTrigger trigger="hover" placement="bottom" overlay={<Popover>An image is a template for a container.</Popover>}>
          <span>What&#39;s an image?</span>
        </OverlayTrigger>
      </div>
    );

    var tagData = self.state.tags[this.state.active];
    var tags;
    if (tagData) {
      var list = tagData.map(function (t) {
        return <li key={t.name} onClick={self.handleTagClick.bind(self, t.name, self.state.active)}>{t.name}</li>;
      });
      tags = (
        <ul>
          {list}
        </ul>
      );
    } else {
      tags = <RetinaImage className="tags-loading" src="loading.png"/>;
    }

    var popoverClasses = React.addons.classSet({
      popover: true,
      hidden: !this.state.active
    });

    return (
      <Modal {...this.props} animation={false} className="create-modal">
        <div className="modal-body" onClick={this.handleModalClick}>
          <section className="search">
            <div className="search-bar">
              <input type="search" ref="searchInput" className="form-control" placeholder="Find an existing image" onChange={this.handleChange}/>
              <div className={magnifierClasses}></div>
              <RetinaImage className={loadingClasses} src="loading.png"/>
            </div>
            {question}
            <div className="results">
              <div className="title">{title}</div>
              {results}
            </div>
          </section>
          <Popover placement="bottom" className={popoverClasses}>
            {tags}
          </Popover>
        </div>
      </Modal>
    );
  }
});

module.exports = ContainerModal;
