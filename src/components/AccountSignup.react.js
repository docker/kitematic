var _ = require('underscore');
var React = require('react/addons');
var Router = require('react-router');
var validator = require('validator');
var accountActions = require('../actions/AccountActions');
var metrics = require('../utils/MetricsUtil');

module.exports = React.createClass({
  mixins: [Router.Navigation, React.addons.LinkedStateMixin],

  getInitialState: function () {
    return {
      username: '',
      password: '',
      email: '',
      subscribe: true,
      errors: {}
    };
  },

  componentDidMount: function () {
    React.findDOMNode(this.refs.usernameInput).focus();
  },

  componentWillReceiveProps: function (nextProps) {
    this.setState({errors: nextProps.errors});
  },

  validate: function () {
    let errors = {};
    if (!validator.isLowercase(this.state.username) || !validator.isAlphanumeric(this.state.username) || !validator.isLength(this.state.username, 4, 30)) {
      errors.username = 'Must be 4-30 lower case letters or numbers';
    }

    if (!validator.isLength(this.state.password, 5)) {
      errors.password = 'Must be at least 5 characters long';
    }

    if (!validator.isEmail(this.state.email)) {
      errors.email = 'Must be a valid email address';
    }
    return errors;
  },

  handleBlur: function () {
    this.setState({errors: _.omit(this.validate(), (val, key) => !this.state[key].length)});
  },

  handleSignUp: function () {
    let errors = this.validate();
    this.setState({errors});

    if (_.isEmpty(errors)) {
      accountActions.signup(this.state.username, this.state.password, this.state.email, this.state.subscribe);
      metrics.track('Clicked Signed Up');
    }
  },

  handleClickLogin: function () {
    if (!this.props.loading) {
      this.replaceWith('login');
      metrics.track('Switched to Log In');
    }
  },

  render: function () {
    let loading = this.props.loading ? <div className="spinner la-ball-clip-rotate la-dark"><div></div></div> : null;
    return (
      <form className="form-connect" onSubmit={this.handleSignUp}>
        <input ref="usernameInput" maxLength="30" name="username" placeholder="Username" type="text" disabled={this.props.loading} valueLink={this.linkState('username')} onBlur={this.handleBlur}/>
        <p className="error-message">{this.state.errors.username}</p>
        <input ref="emailInput" name="email" placeholder="Email" type="text" valueLink={this.linkState('email')} disabled={this.props.loading} onBlur={this.handleBlur}/>
        <p className="error-message">{this.state.errors.email}</p>
        <input ref="passwordInput" name="password" placeholder="Password" type="password" valueLink={this.linkState('password')} disabled={this.props.loading} onBlur={this.handleBlur}/>
        <p className="error-message">{this.state.errors.password}</p>
        <div className="checkbox">
        <label>
          <input type="checkbox" disabled={this.props.loading} checkedLink={this.linkState('subscribe')}/> Subscribe to the Docker newsletter.
        </label>
        </div>
        <p className="error-message">{this.state.errors.detail}</p>
        <div className="submit">
          {loading}
          <button className="btn btn-action" disabled={this.props.loading} type="submit">Sign Up</button>
        </div>
        <br/>
        <div className="extra">Already have an account? <a disabled={this.state.loading} onClick={this.handleClickLogin}>Log In</a></div>
      </form>
    );
  }
});
