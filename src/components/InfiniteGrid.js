var React = require('react/addons');
var PureRenderMixin = React.addons.PureRenderMixin;

/**
 * Inspired from: https://github.com/ggordan/react-infinite-grid
 *
 */

var InfiniteGrid = React.createClass({

  mixins: [ PureRenderMixin ],

  propTypes: {
    entries: React.PropTypes.arrayOf(React.PropTypes.element).isRequired,
    maxEntries: React.PropTypes.number,
    height: React.PropTypes.number,
    width: React.PropTypes.number,
    padding: React.PropTypes.number,
    wrapperHeight: React.PropTypes.number,
    lazyCallback: React.PropTypes.func,
    renderRangeCallback: React.PropTypes.func,
  },

  getDefaultProps: function() {
    return {
      padding: 0,
      entries: [],
      maxEntries: 1,
      height: 250,
      width: 250,
      bufferLength: 4
    };
  },

  getInitialState: function() {
    return {
      initiatedLazyload: false,
      minHeight: window.innerHeight * 2,
      minItemIndex: 0,
      maxItemIndex: 100,
      itemDimensions: {
        height: this._itemHeight(),
        width: this._itemWidth(),
        gridWidth: 0,
        itemsPerRow: 2,
      },
    };
  },

  // METHODS

  _wrapperStyle: function() {
    return {
      maxHeight: window.innerHeight,
      overflowY: 'scroll',
      width: '100%',
      height: this.props.wrapperHeight,
      WebkitOverflowScrolling: 'touch',
    };
  },

  _gridStyle: function() {
    return {
      position: "relative",
      marginTop: this.props.padding,
      marginLeft: this.props.padding,
    };
  },

  _getGridRect: function() {
    return this.refs.grid.getDOMNode().getBoundingClientRect();
  },

  _getGridTop: function() {
    return this.refs.grid.getDOMNode().offsetTop;
  },

  _getWrapperRect: function() {
    return this.refs.wrapper.getDOMNode().getBoundingClientRect();
  },

  _visibleIndexes: function() {
    let itemsPerRow = this._itemsPerRow();

    // The number of rows that the user has scrolled past
    let scrolledPast = (this._scrolledPastRows() * itemsPerRow);
    if (scrolledPast < 0) scrolledPast = 0;

    // If i have scrolled past 20 items, but 60 are visible on screen,
    // we do not want to change the minimum
    let min = scrolledPast - itemsPerRow;
    if (min < 0) min = 0;

    // the maximum should be the number of items scrolled past, plus some
    // buffer
    let bufferRows = this._numVisibleRows() + 1;
    let max = scrolledPast + (itemsPerRow * bufferRows);
    if (max > this.props.entries.length) max = this.props.entries.length;

    this.setState({
      minItemIndex: min,
      maxItemIndex: max,
    }, function() {
      this._lazyCallback();
    });
  },

  _updateItemDimensions: function() {
    this.setState({
      itemDimensions: {
          height: this._itemHeight(),
          width: this._itemHeight(),
          gridWidth: this._getGridRect().width,
          itemsPerRow: this._itemsPerRow(),
      },
      minHeight: this._totalRows(),
    });
  },

  _itemsPerRow: function() {
    return Math.floor(this._getGridRect().width / this._itemWidth());
  },

  _totalRows: function() {
    let scrolledPastHeight = (this.props.entries.length / this._itemsPerRow()) * this._itemHeight();
    if (scrolledPastHeight < 0) return 0;
    return scrolledPastHeight;
  },

  _scrolledPastRows: function() {
    let rect = this._getGridRect();
    let topOffset = this._getGridTop();
    let topScrollOffset = topOffset + (rect.height - rect.bottom);
    return Math.floor(topScrollOffset / this._itemHeight());
  },

  _itemHeight: function() {
    return this.props.height + (2 * this.props.padding);
  },

  _itemWidth: function() {
    return this.props.width + (2 * this.props.padding);
  },

  _numVisibleRows: function() {
    return Math.ceil(this._getWrapperRect().height / this._itemHeight());
  },

  _lazyCallback: function() {
    let lazyLimit = (this.props.entries.length-this.props.bufferLength);
    lazyLimit = lazyLimit < 1? 1:lazyLimit;
    if (!this.state.initiatedLazyload && (this.state.maxItemIndex >= lazyLimit) && (this.state.maxItemIndex < this.props.maxEntries) && this.props.lazyCallback) {
      this.setState({initiatedLazyload: true });
      this.props.lazyCallback(this.state.maxItemIndex);
    } else if (this.state.maxItemIndex === this.props.maxEntries){
      this.setState({initiatedLazyload: false });
    }
  },

  // LIFECYCLE

  componentWillMount: function() {
    window.addEventListener('resize', this._resizeListener);
  },

  componentDidMount: function() {
    this._updateItemDimensions();
    this._visibleIndexes();
  },

  componentWillReceiveProps: function(nextProps) {
    if (nextProps.entries.length > this.props.entries.length) {
      this.setState({
        initiatedLazyload: false,
      });
    }
  },

  componentDidUpdate: function(prevProps, prevState) {
    if (typeof this.props.renderRangeCallback === 'function') {
      this.props.renderRangeCallback(this.state.minItemIndex, this.state.maxItemIndex);
    }
  },

  componentWillUnmount: function() {
    window.removeEventListener('resize', this._resizeListener);
  },

  // LISTENERS

  _scrollListener: function(event) {
    this._visibleIndexes();
  },

  _resizeListener: function(event) {
    if (!this.props.wrapperHeight) {
      this.setState({
        wrapperHeight: window.innerHeight,
      });
    }
    this._updateItemDimensions();
    this._visibleIndexes();
  },

  // RENDER

  render: function() {
    let entries = this.props.entries;
    let loading = (
      <div className="spinner la-ball-clip-rotate la-dark la-lg"><div></div></div>
      );

    return(
      <div ref="wrapper" className="infinite-grid-wrapper" onScroll={this._scrollListener} style={this._wrapperStyle()}>
        <div ref="grid" className="infinite-grid result-grid" style={this._gridStyle()}>
          {entries}
          { this.state.initiatedLazyload ? loading : null }
        </div>
      </div>
    );
  },
});

module.exports = InfiniteGrid;
