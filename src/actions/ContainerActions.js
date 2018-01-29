import alt from '../alt';
import dockerUtil from '../utils/DockerUtil';
import _ from "underscore";

class ContainerActions {

  destroy (name) {
    dockerUtil.destroy(name);
  }

  rename (name, newName) {
    this.dispatch({name, newName});
    dockerUtil.rename(name, newName);
  }

  start (name) {
    this.dispatch({name});
    dockerUtil.start(name);
  }

  stop (name) {
    dockerUtil.stop(name);
  }

  restart (name) {
    this.dispatch({name});
    dockerUtil.restart(name);
  }

  update (name, container) {
    this.dispatch({name, container});
    dockerUtil.updateContainer(name, container);
  }

  clearPending () {
    this.dispatch();
  }

  run (name, repo, tag, network, local=false) {
    dockerUtil.run(name, repo, tag, network, local);
  }

  active (name) {
    dockerUtil.active(name);
  }

  toggleFavorite (name) {
    let favorites = JSON.parse(localStorage.getItem('containers.favorites')) || [];
    if (favorites.includes(name)) {
      favorites = favorites.filter(favoriteName => favoriteName !== name);
    } else {
      favorites = [...favorites, name];
    }
    localStorage.setItem('containers.favorites', JSON.stringify(favorites));
    this.dispatch({name});
  }
}

export default alt.createActions(ContainerActions);
