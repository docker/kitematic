import alt from '../alt';
import dockerUtil from '../utils/DockerUtil';
import hubUtil from '../utils/HubUtil';

class ContainerActions {
  start (name) {
    this.dispatch({name});
    dockerUtil.start(name);
  }

  destroy (name) {
    this.dispatch({name});
    dockerUtil.destroy(name);
  }

  rename (name, newName) {
    this.dispatch({name, newName});
    dockerUtil.rename(name, newName);
  }

  stop (name) {
    this.dispatch({name});
    dockerUtil.stop(name);
  }

  update (name, container) {
    this.dispatch({name, container});
    dockerUtil.updateContainer(name, container);
  }

  clearPending () {
    this.dispatch();
  }

  run (name, repo, tag) {
    dockerUtil.run(hubUtil.config(), name, repo, tag);
  }
}

export default alt.createActions(ContainerActions);
