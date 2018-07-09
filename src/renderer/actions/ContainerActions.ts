import dockerUtil from "../../utils/DockerUtil";
import alt from "../alt";

class ContainerActions {

	public destroy(name) {
		dockerUtil.destroy(name);
	}

	public rename(name, newName) {
		(this as any).dispatch({name, newName});
		dockerUtil.rename(name, newName);
	}

	public start(name) {
		(this as any).dispatch({name});
		dockerUtil.start(name);
	}

	public stop(name) {
		dockerUtil.stop(name);
	}

	public restart(name) {
		(this as any).dispatch({name});
		dockerUtil.restart(name);
	}

	public update(name, container) {
		(this as any).dispatch({name, container});
		dockerUtil.updateContainer(name, container);
	}

	public clearPending() {
		(this as any).dispatch();
	}

	public run(name, repo, tag, network, local= false) {
		dockerUtil.run(name, repo, tag, network, local);
	}

	public active(name) {
		dockerUtil.active(name);
	}

	public toggleFavorite(name) {
		let favorites = JSON.parse(localStorage.getItem("containers.favorites")) || [];
		if (favorites.includes(name)) {
			favorites = favorites.filter((favoriteName) => favoriteName !== name);
		} else {
			favorites = [...favorites, name];
		}
		localStorage.setItem("containers.favorites", JSON.stringify(favorites));
		(this as any).dispatch({name});
	}
}

export default alt.createActions(ContainerActions);
