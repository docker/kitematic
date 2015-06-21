import alt from '../alt';
import dockerUtil from '../utils/DockerUtil';

class ContainerActions {

  destroy (driverName, containerName) {
    this.dispatch({driverName, containerName});
    dockerUtil.clients[driverName].destroy(containerName);
  }

  rename (driverName, containerName, newContainerName) {
    this.dispatch({driverName, containerName, newContainerName});
    dockerUtil.clients[driverName].rename(containerName, newContainerName);
  }

  start (driverName, containerName) {
    this.dispatch({driverName, containerName});
    dockerUtil.clients[driverName].start(containerName);
  }

  stop (driverName, containerName) {
    this.dispatch({driverName, containerName});
    dockerUtil.clients[driverName].stop(containerName);
  }

  restart (driverName, containerName) {
    this.dispatch({driverName, containerName});
    dockerUtil.clients[driverName].restart(containerName);
  }

  update (driverName, name, container) {
    this.dispatch({driverName, name, container});
    dockerUtil.clients[driverName].updateContainer(name, container);
  }

  clearPending () {
    this.dispatch();
  }

  run (driverName, name, repo, tag) {
    dockerUtil.clients[driverName].run(name, repo, tag);
  }
}

export default alt.createActions(ContainerActions);
