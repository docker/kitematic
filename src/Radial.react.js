var React = require('react/addons');

var Radial = React.createClass({
  render: function () {
    var percentage;
    if (this.props.progress && !this.props.spin) {
      percentage = (
        <div className="percentage"></div>
      );
    } else {
      percentage = <div></div>;
    }
    var classes = React.addons.classSet({
      'radial-progress': true,
      'radial-spinner': this.props.spin,
      'radial-negative': this.props.error,
      'radial-thick': this.props.thick || false,
      'radial-gray': this.props.gray || false
    });
    return (
      <div className={classes} data-progress={this.props.progress}>
        <div className="circle">
          <div className="mask full">
            <div className="fill"></div>
          </div>
          <div className="mask half">
            <div className="fill"></div>
          <div className="fill fix"></div>
          </div>
          <div className="shadow"></div>
        </div>
        <div className="inset">
          {percentage}
        </div>
      </div>
    );
  }
});

module.exports = Radial;
