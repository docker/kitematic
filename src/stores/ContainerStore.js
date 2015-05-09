import _ from 'underscore';
import alt from '../alt';
import containerServerActions from '../actions/ContainerServerActions';
import containerActions from '../actions/ContainerActions';

class ContainerStore {
  constructor () {
    this.bindActions(containerActions);
    this.bindActions(containerServerActions);
    this.containers = {};

    // Blacklist of containers to avoid updating
    this.muted = {};
  }

  start ({name}) {
    let containers = this.containers;
    if (containers[name]) {
      containers[name].State.Starting = true;
      this.setState({containers});
    }
  }

  stop ({name}) {
    let containers = this.containers;
    if (containers[name]) {
      containers[name].State.Running = false;
      this.setState({containers});
    }
  }

  rename ({name, newName}) {
    let containers = this.containers;
    let data = containers[name];
    data.Name = newName;
    containers[newName] = data;
    delete containers[name];
    this.setState({containers});
  }

  added ({container}) {
    let containers = this.containers;
    containers[container.Name] = container;
    delete this.muted[container.Name];
    this.setState({containers});
  }

  updated ({container}) {
    if (this.muted[container.Name]) {
      return;
    }

    let containers = this.containers;
    if (!containers[container.Name]) {
      return;
    }
    containers[container.Name] = container;
    if (container.State.Running) {
      delete container.State.Starting;
    }
    this.setState({containers});
  }

  allUpdated ({containers}) {
    this.setState({containers});
  }

  progress ({name, progress}) {
    let containers = this.containers;
    if (containers[name]) {
      containers[name].Progress = progress;
    }
    this.setState({containers});
  }

  destroy ({name}) {
    let containers = this.containers;
    delete containers[name];
    this.setState({containers});
  }

  destroyed ({name}) {
    let containers = this.containers;
    let container = _.find(_.values(this.containers), container => {
      return container.Id === name || container.Name === name;
    });
    if (container && !this.muted[container.Name]) {
      delete containers[container.Name];
      this.setState({containers});
    }
  }

  muted ({name}) {
    this.muted[name] = true;
  }

  unmuted ({name}) {
    this.muted[name] = false;
  }

  waiting({name, waiting}) {
    let containers = this.containers;
    if (containers[name]) {
      containers[name].State.Waiting = waiting;
    }
    this.setState({containers});
  }

  error ({ name, error }) {
    let containers = this.containers;
    if (containers[name]) {
      containers[name].Error = error;
    }
    this.setState({containers});
  }

  static generateName (repo) {
    let base = _.last(repo.split('/'));
    let count = 1;
    let name = base;
    let names = _.keys(this.getState().containers);
    while (true) {
      if (names.indexOf(name) === -1) {
        return name;
      } else {
        count++;
        name = base + '-' + count;
      }
    }
  }
}

export default alt.createStore(ContainerStore);
