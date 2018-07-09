import _ from "underscore";
import docker from "../../utils/DockerUtil";

export default {
	env(container) {
		if (!container || !container.Config || !container.Config.Env) {
			return [];
		}
		return _.map(container.Config.Env, (env) => {
			let i = env.indexOf("=");
			return [env.slice(0, i), env.slice(i + 1)];
		});
	},

	// Provide Foreground options
	mode(container) {
		return [
			(container && container.Config) ? container.Config.Tty : true,
			(container && container.Config) ? container.Config.OpenStdin : true,
			(container && container.HostConfig) ? container.HostConfig.Privileged : false,
			(container && container.HostConfig) ? container.HostConfig.RestartPolicy : {MaximumRetryCount: 0, Name: "no"},
		];
	},

	// TODO: inject host here instead of requiring Docker
	ports(container) {
		if (!container || !container.NetworkSettings) {
			return {};
		}
		let res = {};
		let ip = docker.host;
		let ports = (container.NetworkSettings.Ports) ? container.NetworkSettings.Ports : ((container.HostConfig.PortBindings) ? container.HostConfig.PortBindings : container.Config.ExposedPorts);
		_.each(ports, function(value, key) {
			let [dockerPort, portType] = key.split("/");
			let localUrl = null;
			let port = null;
			if (value && value.length) {
				port = value[0].HostPort;
			}
			localUrl = (port) ? ip + ":" + port : ip + ":" + "<not set>";

			res[dockerPort] = {
				url: localUrl,
				ip,
				port,
				portType,
			};
		});
		return res;
	},

	links(container) {
		if (!container || !container.HostConfig || !container.HostConfig.Links) {
			return [];
		}

		return _.map(container.HostConfig.Links, (link, key) => {
			return {
				container: link.split(":")[0].split("/")[1],
				alias: link.split(":")[1].split("/")[2],
			};
		});
	},

	normalizeLinksPath(container, links) {
		return _.map(links, (link) => {
			return "/" + link.container + ":/" + container.Name + "/" + link.alias;
		});
	},

};
