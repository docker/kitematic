var React = require('react/addons');
var Router = require('react-router');
var Radial = require('./Radial.react.js');
var SetupStore = require('./SetupStore');
var RetinaImage = require('react-retina-image');
var Header = require('./Header.react');

var Setup = React.createClass({
  mixins: [ Router.Navigation ],
  getInitialState: function () {
    return {
      progress: 0,
      name: ''
    };
  },
  componentWillMount: function () {
    SetupStore.on(SetupStore.PROGRESS_EVENT, this.update);
    SetupStore.on(SetupStore.STEP_EVENT, this.update);
    SetupStore.on(SetupStore.ERROR_EVENT, this.update);
  },
  componentDidMount: function () {
    this.update();
  },
  componentDidUnmount: function () {
    SetupStore.removeListener(SetupStore.PROGRESS_EVENT, this.update);
    SetupStore.removeListener(SetupStore.STEP_EVENT, this.update);
    SetupStore.removeListener(SetupStore.ERROR_EVENT, this.update);
  },
  update: function () {
    this.setState({
      progress: SetupStore.percent(),
      step: SetupStore.step(),
      error: SetupStore.error()
    });
  },
  renderContents: function () {
    var img = 'virtualbox.png';
    if (SetupStore.step().name.indexOf('Boot2Docker') !== -1) {
      img = 'boot2docker.png';
    }
    return (
      <div className="contents">
        <RetinaImage src={img}/>
        <div className="detail">
          <Radial progress={SetupStore.percent()} thick={true} gray={true}/>
        </div>
      </div>
    );
  },
  renderStep: function () {
    return (
      <div className="setup">
        <Header />
        <div className="image">
          {this.renderContents()}
        </div>
        <div className="desc">
          <div className="content">
            <h4>Step {SetupStore.number()} out of {SetupStore.stepCount()}</h4>
            <h1>{SetupStore.step().title}</h1>
            <p>{SetupStore.step().message}</p>
          </div>
        </div>
      </div>
    );
  },
  renderError: function () {
    return (
      <div className="setup">
        <Header />
        <div className="image">
          <div className="contents">
            <RetinaImage img src="install-error.png"/>
            <div className="detail">
            </div>
          </div>
        </div>
        <div className="desc">
          <div className="content">
            <h4>Installation Error</h4>
            <h1>We&#39;re Sorry!</h1>
            <p>There seems to have been an unexpected error with Kitematic:</p>
            <p className="error">{this.state.error.message}</p>
          </div>
        </div>
      </div>
    );
  },
  render: function () {
    if (!SetupStore.step()) {
      return false;
    }
    if (this.state.error) {
      return this.renderError();
    } else {
      return this.renderStep();
    }
  }
});

module.exports = Setup;
