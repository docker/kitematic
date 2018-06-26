import React from 'react/addons';
import Header from '../renderer/components/Header.react.jsx';

module.exports = React.createClass({
  render: function () {
    return (
      <div className="loading">
        <Header hideLogin={true}/>
        <div className="loading-content">
          <div className="spinner la-ball-clip-rotate la-lg la-dark"><div></div></div>
        </div>
      </div>
    );
  }
});
