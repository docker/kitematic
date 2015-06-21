import alt from '../alt';
import dockerUtil from '../utils/DockerUtil';

class ContainerActions {

  destroy ( containerName) {
    this.dispatch({ containerName});
    dockerUtil.activeClient.destroy(containerName);
  }

  rename ( containerName, newContainerName) {
    this.dispatch({ containerName, newContainerName});
    dockerUtil.activeClient.rename(containerName, newContainerName);
  }

  start ( containerName) {
    this.dispatch({ containerName});
    dockerUtil.activeClient.start(containerName);
  }

  stop ( containerName) {
    this.dispatch({ containerName});
    dockerUtil.activeClient.stop(containerName);
  }

  restart ( containerName) {
    this.dispatch({ containerName});
    dockerUtil.activeClient.restart(containerName);
  }

  update ( name, container) {
    this.dispatch({ name, container});
    dockerUtil.activeClient.updateContainer(name, container);
  }

  clearPending () {
    this.dispatch();
  }

  run ( name, repo, tag) {
    this.dispatch({ name, repo, tag});
    dockerUtil.activeClient.run(name, repo, tag);
  }
}

export default alt.createActions(ContainerActions);
