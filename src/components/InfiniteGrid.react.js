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
    parentComp: React.PropTypes.object,
    maxEntries: React.PropTypes.number,
    height: React.PropTypes.number,
    width: React.PropTypes.number,
    lazyCallback: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      entries: [],
      parentComp: null,
      maxEntries: 1,
      height: 250,
      width: 250,
      bufferLength: 4
    };
  },

  getInitialState: function () {
    return {
      initiatedLazyload: false,
      minItemIndex: 0,
      maxItemIndex: 100,
      parentComp: null,
      wrapperHeight: 100,
      itemDimensions: {
        height: this.props.height,
        width: this.props.width,
        gridWidth: 0,
        itemsPerRow: 2,
      },
    };
  },

  _getGridRect: function () {
    return this.refs.grid.getDOMNode().getBoundingClientRect();
  },

  _getParentHeight: function () {
    return this.props.parentComp.getDOMNode().clientHeight;
  },

  _getGridTop: function () {
    return this.refs.grid.getDOMNode().offsetTop;
  },

  _visibleIndexes: function () {
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
    }, function () {
      this._lazyCallback();
    });
  },

  _updateItemDimensions: function () {
    this.setState({
      itemDimensions: {
          height: this.props.height,
          width: this.props.width,
          gridWidth: this._getGridRect().width,
          itemsPerRow: this._itemsPerRow(),
      },
      wrapperHeight: this._getParentHeight()
    });
  },

  _itemsPerRow: function () {
    return Math.floor(this._getGridRect().width / this.props.width);
  },

  _totalRows: function () {
    let scrolledPastHeight = (this.props.entries.length / this._itemsPerRow()) * this.props.height;
    if (scrolledPastHeight < 0) return 0;
    return scrolledPastHeight;
  },

  _scrolledPastRows: function () {
    let rect = this._getGridRect();
    let topOffset = this._getGridTop();
    let topScrollOffset = topOffset + (rect.height - rect.bottom);
    return Math.floor(topScrollOffset / this.props.height);
  },

  _numVisibleRows: function () {
    return Math.ceil(this.state.wrapperHeight / this.props.height);
  },

  _lazyCallback: function () {
    let lazyLimit = (this.props.entries.length-this.props.bufferLength);
    lazyLimit = lazyLimit < 1? 1:lazyLimit;
    if (!this.state.initiatedLazyload && (this.state.maxItemIndex >= lazyLimit) && (this.state.maxItemIndex < this.props.maxEntries) && this.props.lazyCallback) {
      this.setState({initiatedLazyload: true });
      this.props.lazyCallback(this.state.maxItemIndex);
    } else if (this.state.maxItemIndex === this.props.maxEntries){
      this.setState({initiatedLazyload: false });
    }
  },

  componentDidMount: function () {
    this._updateItemDimensions();
    this._visibleIndexes();
  },
  componentWillMount: function () {
    window.addEventListener('resize', this._resizeListener);
  },
  componentWillUnmount: function () {
    window.removeEventListener('resize', this._resizeListener);
  },

  componentWillReceiveProps: function (nextProps) {
    if (nextProps.entries.length > this.props.entries.length) {
      this.setState({
        initiatedLazyload: false,
      });
    }
  },

  _scrollListener: function (event) {
    this._visibleIndexes();
  },
  _resizeListener: function (event) {
     if (!this.state.wrapperHeight) {
       this.setState({
           wrapperHeight: window.innerHeight,
       });
     }
     this._updateItemDimensions();
     this._visibleIndexes();
   },

  render: function () {
    let entries = this.props.entries;
    let loading = (
      <div className="spinner la-ball-clip-rotate la-dark la-lg"><div></div></div>
      );

    return(
        <div ref="grid" className="infinite-grid result-grid">
          {entries}
          {this.state.initiatedLazyload ? loading : null}
        </div>
    );
  },
});

module.exports = InfiniteGrid;
