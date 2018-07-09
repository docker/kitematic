import {shell} from "electron";
import {DropdownButton, MenuItem} from "react-bootstrap";
import React from "react/addons";
import _ from "underscore";
import containerActions from "../../actions/ContainerActions";
import containerStore from "../../stores/ContainerStore";
import ContainerUtil from "../../utils/ContainerUtil";
import docker from "../../utils/DockerUtil";
import metrics from "../../utils/MetricsUtil";

export default React.createClass({
	contextTypes: {
		router: React.PropTypes.func,
	},
	getInitialState() {
		let ports = ContainerUtil.ports(this.props.container);
		let initialPorts = this.props.container.InitialPorts;
		ports[""] = {
			ip: docker.host,
			url: "",
			port: "",
			portType: "tcp",
			error: null,
		};
		return {
			ports,
			initialPorts,
			hostname: this.props.container.Config.Hostname,
		};
	},
	handleViewLink(url) {
		metrics.track("Opened In Browser", {
			from: "settings",
		});
		shell.openExternal("http://" + url);
	},
	createEmptyPort(ports) {
		ports[""] = {
			ip: docker.host,
			url: "",
			port: "",
			portType: "tcp",
		};
		(document.getElementById("portKey") as any).value = "";
		(document.getElementById("portValue") as any).value = "";
	},
	addPort() {
		if (document.getElementById("portKey") !== null) {
			let portKey = (document.getElementById("portKey") as any).value;
			let portValue = (document.getElementById("portValue") as any).value;
			let portTypeValue = document.getElementById("portType").textContent;
			let ports = this.state.ports;
			if (portKey !== "") {
				ports[portKey] = {
					ip: docker.host,
					url: docker.host + ":" + portValue,
					port: portValue,
					portType: portTypeValue.trim(),
					error: null,
				};

				this.checkPort(ports, portKey, portKey);
				if (ports[portKey].error === null) {
					this.createEmptyPort(ports);
				}
			}
			return ports;
		}
	},
	handleAddPort(e) {
		let ports = this.addPort();
		this.setState({ports});
		metrics.track("Added Pending Port");
	},
	checkPort(ports, port, key) {
		// basic validation, if number is integer, if its in range, if there
		// is no collision with ports of other containers and also if there is no
		// collision with ports for current container
		const otherContainers = _.filter(_.values(containerStore.getState().containers), (c) => c.Name !== this.props.container.Name);
		const otherPorts = _.flatten(otherContainers.map((container) => {
			try {
				return _.values(container.NetworkSettings.Ports).map((hosts) => hosts.map((host) => {
						return {port: host.HostPort, name: container.Name};
					}),
				);
			} catch (err) {

			}
		})).reduce((prev, pair) => {
			try {
				prev[pair.port] = pair.name;
			} catch (err) {

			}
			return prev;
		}, {});

		const duplicates = _.filter(ports, (v, i) => {
			return (i !== key && _.isEqual(v.port, port));
		});

		if (!port.match(/^[0-9]+$/g)) {
			ports[key].error = "Needs to be an integer.";
		} else if (port <= 0 || port > 65535) {
			ports[key].error = "Needs to be in range <1,65535>.";
		} else if (otherPorts[port]) {
			ports[key].error = 'Collision with container "' + otherPorts[port] + '"';
		} else if (duplicates.length > 0) {
			ports[key].error = "Collision with another port in this container.";
		} else if (port === 22 || port === 2376) {
			ports[key].error = "Ports 22 and 2376 are reserved ports for Kitematic/Docker.";
		}
	},
	handleChangePort(key, e) {
		let ports = this.state.ports;
		let port = e.target.value;
		// save updated port
		ports[key] = _.extend(ports[key], {
			url: ports[key].ip + ":" + port,
			port,
			error: null,
		});
		this.checkPort(ports, port, key);

		this.setState({ports});
	},
	handleChangePortKey(key, e) {
		let ports = this.state.ports;
		let portKey = e.target.value;

		// save updated port
		let currentPort = ports[key];

		delete ports[key];
		ports[portKey] = currentPort;

		this.setState({ports});
	},
	handleRemovePort(key, e) {
		let ports = this.state.ports;
		delete ports[key];
		this.setState({ports});
	},
	handleChangePortType(key, portType) {
		let ports = this.state.ports;
		let port = ports[key].port;

		// save updated port
		ports[key] = _.extend(ports[key], {
			url: ports[key].ip + ":" + port,
			port,
			portType,
			error: null,
		});
		this.setState({ports});
	},
	isInitialPort(key, ports) {
		for (let idx in ports) {
			if (ports.hasOwnProperty(idx)) {
				let p = idx.split("/");
				if (p.length > 0) {
					if (p[0] === key) {
						return true;
					}
				}
			}
		}
		return false;
	},
	handleChangeHostnameEnabled(e) {
		let value = e.target.value;
		this.setState({
			hostname: value,
		});
	},
	handleSave() {
		let ports = this.state.ports;
		ports = this.addPort();
		this.setState({ports});
		let exposedPorts = {};
		let portBindings = _.reduce(ports, (res, value, key) => {
			if (key !== "") {
				res[key + "/" + value.portType] = [{
					HostPort: value.port,
				}];
				exposedPorts[key + "/" + value.portType] = {};
			}
			return res;
		}, {});

		let hostConfig = _.extend(this.props.container.HostConfig, {PortBindings: portBindings, Hostname: this.state.hostname});
		let config = _.extend(this.props.container.Config, {Hostname: this.state.hostname});
		containerActions.update(this.props.container.Name, {ExposedPorts: exposedPorts, HostConfig: hostConfig, Config: config});

	},
	render() {
		if (!this.props.container) {
			return false;
		}
		let isUpdating = (this.props.container.State.Updating);
		let isValid = true;

		let ports = _.map(_.pairs(this.state.ports), (pair) => {
			let key = pair[0];
			let {ip, port, url, portType, error} = pair[1];
			isValid = (error) ? false : isValid;
			let ipLink = (this.props.container.State.Running && !this.props.container.State.Paused && !this.props.container.State.ExitCode && !this.props.container.State.Restarting) ? (<a onClick={this.handleViewLink.bind(this, url)}>{ip}</a>) : ({ip});
			let icon = "" as any;
			let portKey = "" as any;
			let portValue = "" as any;
			if (key === "") {
				icon = <td><button disabled={isUpdating} onClick={this.handleAddPort} className="only-icon btn btn-positive small"><span className="icon icon-add"></span></button></td>;
				portKey = <input id={"portKey" + key} type="text" disabled={isUpdating} defaultValue={key} />;
				portValue = <input id={"portValue" + key} type="text" disabled={isUpdating} defaultValue={port} />;
			} else {
				if (this.isInitialPort(key, this.state.initialPorts)) {
					icon = <td></td>;
				} else {
					icon = <td><button disabled={isUpdating} onClick={this.handleRemovePort.bind(this, key)} className="only-icon btn btn-action small"><span className="icon icon-delete"></span></button></td>;
				}
				portKey = <input id={"portKey" + key} type="text" onChange={this.handleChangePortKey.bind(this, key)} disabled={isUpdating} defaultValue={key} />;
				portValue = <input id={"portValue" + key} type="text" onChange={this.handleChangePort.bind(this, key)} disabled={isUpdating} defaultValue={port} />;
			}
			return (
				<tr key={key}>
					<td>{portKey}</td>
					<td className="bind">
						{ipLink}:
						{portValue}
					</td>
					<td>
						<DropdownButton disabled={isUpdating} id= {"portType" + key } bsStyle="primary" title={portType} >
							<MenuItem onSelect={this.handleChangePortType.bind(this, key, "tcp")} key={key + "-tcp"}>TCP</MenuItem>
							<MenuItem onSelect={this.handleChangePortType.bind(this, key, "udp")} key={key + "-udp"}>UDP</MenuItem>
						</DropdownButton>
					</td>
					{icon}
					<td className="error">{error}</td>
				</tr>
			);
		});
		return (
			<div className="settings-panel">
				<div className="settings-section">
					<h3>Configure Hostname</h3>
					<div className="container-info-row">
						<div className="label-hostname">HOSTNAME</div>
						<input id="hostname" className="line" type="text" disabled={isUpdating} value={this.state.hostname} onChange={this.handleChangeHostnameEnabled}/>
					</div>
				</div>
				<div className="settings-section">
					<h3>Configure Ports</h3>
					<table className="table ports">
						<thead>
						<tr>
							<th>DOCKER PORT</th>
							<th>PUBLISHED IP:PORT</th>
							<th></th>
						</tr>
						</thead>
						<tbody>
						{ports}
						</tbody>
					</table>
					<button className="btn btn-action"
					   disabled={isUpdating || !isValid}
					   onClick={this.handleSave}>
						Save
					</button>
				</div>
			</div>
		);
	},
});
