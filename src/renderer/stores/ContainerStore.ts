import _ from "underscore";
import containerActions from "../../actions/ContainerActions";
import containerServerActions from "../../actions/ContainerServerActions";
import alt from "../alt";

let MAX_LOG_SIZE = 3000;

class ContainerStore {

	public static generateName(repo) {
		const base = _.last(repo.split("/"));
		const names = _.keys((this as any).getState().containers);
		let count = 1;
		let name = base;
		while (true) {
			if (names.indexOf(name) === -1) {
				return name;
			} else {
				count++;
				name = base + "-" + count;
			}
		}
	}

	constructor() {
		(this as any).bindActions(containerActions);
		(this as any).bindActions(containerServerActions);
		(this as any).containers = {};

		// Pending container to create
		this.pending = null;
	}

	public error({name, error}) {
		let containers = (this as any).containers;
		if (containers[name]) {
			containers[name].Error = error;
		}
		(this as any).setState({containers});
	}

	public start({name}) {
		let containers = (this as any).containers;
		if (containers[name]) {
			containers[name].State.Starting = true;
			(this as any).setState({containers});
		}
	}

	public started({name}) {
		let containers = (this as any).containers;
		if (containers[name]) {
			containers[name].State.Starting = false;
			containers[name].State.Updating = false;
			(this as any).setState({containers});
		}
	}

	public stopped({id}) {
		let containers = (this as any).containers;
		let container = _.find(_.values(containers), (c) => c.Id === id || c.Name === id);

		if (containers[container.Name]) {
			containers[container.Name].State.Stopping = false;
			(this as any).setState({containers});
		}
	}

	public kill({id}) {
		let containers = (this as any).containers;
		let container = _.find(_.values(containers), (c) => c.Id === id || c.Name === id);

		if (containers[container.Name]) {
			containers[container.Name].State.Stopping = true;
			(this as any).setState({containers});
		}
	}

	public rename({name, newName}) {
		let containers = (this as any).containers;
		let data = containers[name];
		data.Name = newName;

		if (data.State) {
			data.State.Updating = true;
		}

		containers[newName] = data;
		delete containers[name];
		(this as any).setState({containers});
	}

	public added({container}) {
		let containers = (this as any).containers;
		containers[container.Name] = container;
		(this as any).setState({containers});
	}

	public update({name, container}) {
		let containers = (this as any).containers;
		if (containers[name] && containers[name].State && containers[name].State.Updating) {
			return;
		}

		if (containers[name].State.Stopping) {
			return;
		}

		_.extend(containers[name], container);

		if (containers[name].State) {
			containers[name].State.Updating = true;
		}

		(this as any).setState({containers});
	}

	public updated({container}) {
		if (!container || !container.Name) {
			return;
		}

		let containers = (this as any).containers;
		if (containers[container.Name] && containers[container.Name].State.Updating) {
			return;
		}

		if (containers[container.Name] && containers[container.Name].Logs) {
			container.Logs = containers[container.Name].Logs;
		}

		containers[container.Name] = container;
		(this as any).setState({containers});
	}

	public allUpdated({containers}) {
		(this as any).setState({containers});
	}

	// Receives the name of the container and columns of progression
	// A column represents progression for one or more layers
	public progress({name, progress}) {
		let containers = (this as any).containers;

		if (containers[name]) {
			containers[name].Progress = progress;
		}

		(this as any).setState({containers});
	}

	public destroyed({id}) {
		let containers = (this as any).containers;
		let container = _.find(_.values(containers), (c) => c.Id === id || c.Name === id);

		if (container && container.State && container.State.Updating) {
			return;
		}

		if (container) {
			delete containers[container.Name];
			(this as any).setState({containers});
		}
	}

	public waiting({name, waiting}) {
		let containers = (this as any).containers;
		if (containers[name]) {
			containers[name].State.Waiting = waiting;
		}
		(this as any).setState({containers});
	}

	public pending({repo, tag}) {
		let pending = {repo, tag};
		(this as any).setState({pending});
	}

	public clearPending() {
		(this as any).setState({pending: null});
	}

	public log({name, entry}) {
		let container = (this as any).containers[name];
		if (!container) {
			return;
		}

		if (!container.Logs) {
			container.Logs = [];
		}

		container.Logs.push.apply(container.Logs, entry.split("\n").filter((e) => e.length));
		container.Logs = container.Logs.slice(container.Logs.length - MAX_LOG_SIZE, MAX_LOG_SIZE);
		(this as any).emitChange();
	}

	public logs({name, logs}) {
		let container = (this as any).containers[name];

		if (!container) {
			return;
		}

		container.Logs = logs.split("\n");
		container.Logs = container.Logs.slice(container.Logs.length - MAX_LOG_SIZE, MAX_LOG_SIZE);
		(this as any).emitChange();
	}

	public toggleFavorite({name}) {
		let containers = (this as any).containers;

		if (containers[name]) {
			containers[name].Favorite = !containers[name].Favorite;
		}

		(this as any).setState({containers});
	}

}

export default alt.createStore(ContainerStore);
