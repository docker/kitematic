var React = require('react/addons');

var PullContainer = React.createClass({
  componentDidMount: function () {
  },
  render: function () {
    console.log(this.props.pending);
    return (
      <div className="details">
      test
      </div>
    );
  }
});

module.exports = PullContainer;
