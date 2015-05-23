var React = require('react');

/*

  Usage: <ContainerProgress pBar1={20} pBar2={70} pBar3={100} pBar4={20} />

*/
var ContainerProgress = React.createClass({
  render: function () {
    var pBar1Style = {
      height: this.props.pBar1 + '%'
    };
    var pBar2Style = {
      height: this.props.pBar2 + '%'
    };
    var pBar3Style = {
      height: this.props.pBar3 + '%'
    };
    var pBar4Style = {
      height: this.props.pBar4 + '%'
    };
    return (
      <div className="container-progress">
        <div className="bar-1 bar-bg">
          <div className="bar-1 bar-fg" style={pBar4Style}></div>
        </div>
        <div className="bar-2 bar-bg">
          <div className="bar-2 bar-fg" style={pBar3Style}></div>
        </div>
        <div className="bar-3 bar-bg">
          <div className="bar-3 bar-fg" style={pBar2Style}></div>
        </div>
        <div className="bar-4 bar-bg">
          <div className="bar-4 bar-fg" style={pBar1Style}></div>
        </div>
      </div>
    );
  }
});

module.exports = ContainerProgress;
