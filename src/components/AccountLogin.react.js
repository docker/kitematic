import _ from 'underscore';
import React from 'react/addons';
import Router from 'react-router';
import validator from 'validator';
import accountActions from '../actions/AccountActions';
import metrics from '../utils/MetricsUtil';
import shell from 'shell';

module.exports = React.createClass({
  mixins: [Router.Navigation, React.addons.LinkedStateMixin],

  getInitialState: function () {
    return {
      username: '',
      password: '',
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

    if (this.state.username.indexOf('@') > -1) {
      if (!validator.isEmail(this.state.username)) {
        errors.username = 'Must be a valid email';
      }
    }
    else if (!validator.isLowercase(this.state.username) || !validator.isAlphanumeric(this.state.username) || !validator.isLength(this.state.username, 4, 30)) {
      errors.username = 'Must be 4-30 lower case letters or numbers, or a valid email';
    }

    if (!validator.isLength(this.state.password, 5)) {
      errors.password = 'Must be at least 5 characters long';
    }

    return errors;
  },

  handleBlur: function () {
    this.setState({errors: _.omit(this.validate(), (val, key) => !this.state[key].length)});
  },

  handleLogin: function () {
    let errors = this.validate();
    this.setState({errors});

    if (_.isEmpty(errors)) {
      accountActions.login(this.state.username, this.state.password);
      metrics.track('Clicked Log In');
    }
  },

  handleClickSignup: function () {
    if (!this.props.loading) {
      this.replaceWith('signup');
      metrics.track('Switched to Sign Up');
    }
  },

  handleClickForgotPassword: function () {
    shell.openExternal('https://hub.docker.com/reset-password/');
  },

  render: function () {
    let loading = this.props.loading ? <div className="spinner la-ball-clip-rotate la-dark"><div></div></div> : null;
    return (
      <form className="form-connect">
        <input ref="usernameInput"maxLength="30" name="username" placeholder="Username or Email" type="text" disabled={this.props.loading} valueLink={this.linkState('username')} onBlur={this.handleBlur}/>
        <p className="error-message">{this.state.errors.username}</p>
        <input ref="passwordInput" name="password" placeholder="Password" type="password" disabled={this.props.loading} valueLink={this.linkState('password')} onBlur={this.handleBlur}/>
        <p className="error-message">{this.state.errors.password}</p>
        <a className="link" onClick={this.handleClickForgotPassword}>Forgot your password?</a>
        <p className="error-message">{this.state.errors.detail}</p>
        <div className="submit">
          {loading}
          <button className="btn btn-action" disabled={this.props.loading} onClick={this.handleLogin} type="submit">Log In</button>
        </div>
        <br/>
        <div className="extra">Don&#39;t have an account yet? <a disabled={this.state.loading} onClick={this.handleClickSignup}>Sign Up</a></div>
      </form>
    );
  }
});
