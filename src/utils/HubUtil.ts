import request from "request";
import _ from "underscore";
import accountServerActions from "../actions/AccountServerActions";
import metrics from "./MetricsUtil";

const HUB2_ENDPOINT = process.env.HUB2_ENDPOINT || "https://hub.docker.com/v2";

export default {
  init() {
	accountServerActions.prompted({prompted: localStorage.getItem("auth.prompted")});
	const username = localStorage.getItem("auth.username");
	const verified = localStorage.getItem("auth.verified") === "true";
	if (username) {
		accountServerActions.loggedin({username, verified});
	}
  },

  username() {
	return localStorage.getItem("auth.username") || null;
  },

  // Returns the base64 encoded index token or null if no token exists
  config() {
	const config = localStorage.getItem("auth.config");
	if (!config) {
		return null;
	}
	return config;
  },

  // Retrives the current jwt hub token or null if no token exists
  jwt() {
	const jwt = localStorage.getItem("auth.jwt");
	if (!jwt) {
		return null;
	}
	return jwt;
  },

  prompted() {
	return localStorage.getItem("auth.prompted");
  },

  setPrompted(prompted) {
	localStorage.setItem("auth.prompted", true as any);
	accountServerActions.prompted({prompted});
  },

  request(req, callback) {
	const jwt = this.jwt();

	if (jwt) {
		_.extend(req, {
		headers: {
			Authorization: `JWT ${jwt}`,
		},
		});
	}

	// First attempt with existing JWT
	request(req, (error, response, body) => {
		let data;
		try {
		data = JSON.parse(body);
		} catch (e) {
		console.error("Json parse error: %o", e);
		}

		// If the JWT has expired, then log in again to get a new JWT
		if (data && data.detail && data.detail.indexOf("expired") !== -1) {
		const config = this.config();
		if (!this.config()) {
			this.logout();
			return;
		}

		const [username, password] = this.creds(config);
		this.auth(username, password, (error, response, body) => {
			const data = JSON.parse(body);
			if (response.statusCode === 200 && data && data.token) {
			localStorage.setItem("auth.jwt", data.token);
			this.request(req, callback);
			} else {
			this.logout();
			}
		});
		} else {
		callback(error, response, body);
		}
	});
  },

  loggedin() {
	return this.jwt() && this.config();
  },

  logout() {
	accountServerActions.loggedout();
	localStorage.removeItem("auth.jwt");
	localStorage.removeItem("auth.username");
	localStorage.removeItem("auth.verified");
	localStorage.removeItem("auth.config");

	this.request({
		url: `${HUB2_ENDPOINT}/logout`,
	}, (error, response, body) => {});
  },

  login(username, password, callback?) {
	this.auth(username, password, (error, response, body) => {
		if (error) {
		accountServerActions.errors({errors: {detail: error.message}});
		callback(error);
		return;
		}

		const data = JSON.parse(body);

		if (response.statusCode === 200) {
		if (data.token) {
			localStorage.setItem("auth.jwt", data.token);
			localStorage.setItem("auth.username", username);
			localStorage.setItem("auth.verified", true as any);
			localStorage.setItem("auth.config", new Buffer(username + ":" + password).toString("base64"));
			accountServerActions.loggedin({username, verified: true});
			accountServerActions.prompted({prompted: true});
			metrics.track("Successfully Logged In");
			if (callback) { callback(); }
			require("./RegHubUtil").repos();
		} else {
			accountServerActions.errors({errors: {detail: "Did not receive login token."}});
			if (callback) { callback(new Error("Did not receive login token.")); }
		}
		} else if (response.statusCode === 401) {
		if (data && data.detail && data.detail.indexOf("Account not active yet") !== -1) {
			accountServerActions.loggedin({username, verified: false});
			accountServerActions.prompted({prompted: true});
			localStorage.setItem("auth.username", username);
			localStorage.setItem("auth.verified", false as any);
			localStorage.setItem("auth.config", new Buffer(username + ":" + password).toString("base64"));
			if (callback) { callback(); }
		} else {
			accountServerActions.errors({errors: data});
			if (callback) { callback(new Error(data.detail)); }
		}
		}
	});
  },

  auth(username, password, callback) {
	request.post(`${HUB2_ENDPOINT}/users/login/`, {form: {username, password}}, (error, response, body) => {
		callback(error, response, body);
	});
  },

  verify() {
	const config = this.config();
	if (!config) {
		this.logout();
		return;
	}

	const [username, password] = this.creds(config);
	this.login(username, password);
  },

  creds(config) {
	return new Buffer(config, "base64").toString().split(/:(.+)?/).slice(0, 2);
  },

  // Signs up and places a token under ~/.dockercfg and saves a jwt to localstore
  signup(username, password, email, subscribe) {
	request.post(`${HUB2_ENDPOINT}/users/signup/`, {
		form: {
		username,
		password,
		email,
		subscribe,
		},
	}, (err, response, body) => {
		if (response && response.statusCode === 204) {
		accountServerActions.signedup({username, verified: false});
		accountServerActions.prompted({prompted: true});
		localStorage.setItem("auth.username", username);
		localStorage.setItem("auth.verified", false as any);
		localStorage.setItem("auth.config", new Buffer(username + ":" + password).toString("base64"));
		metrics.track("Successfully Signed Up");
		} else {
		const data = JSON.parse(body);
		const errors = {};
		for (const key in data) {
			errors[key] = data[key][0];
		}
		accountServerActions.errors({errors});
		}
	});
  },
};
