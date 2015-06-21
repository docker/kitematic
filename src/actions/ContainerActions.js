import alt from '../alt';
import dockerUtil from '../utils/DockerUtil';

class ContainerActions {

  destroy ( containerName) {
    this.dispatch({ containerName});
    dockerUtil.destroy(containerName);
  }

  rename ( containerName, newContainerName) {
    this.dispatch({ containerName, newContainerName});
    dockerUtil.rename(containerName, newContainerName);
  }

  start ( containerName) {
    this.dispatch({ containerName});
    dockerUtil.start(containerName);
  }

  stop ( containerName) {
    this.dispatch({ containerName});
    dockerUtil.stop(containerName);
  }

  restart ( containerName) {
    this.dispatch({ containerName});
    dockerUtil.restart(containerName);
  }

  update ( name, container) {
    this.dispatch({ name, container});
    dockerUtil.updateContainer(name, container);
  }

  clearPending () {
    this.dispatch();
  }

  run ( name, repo, tag) {
    this.dispatch({ name, repo, tag});
    dockerUtil.run(name, repo, tag);
  }
}

export default alt.createActions(ContainerActions);
