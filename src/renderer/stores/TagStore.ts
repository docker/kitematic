import accountServerActions from "../../actions/AccountServerActions";
import tagActions from "../../actions/TagActions";
import tagServerActions from "../../actions/TagServerActions";
import alt from "../alt";

class TagStore {
	public constructor() {
		(this as any).bindActions(tagActions);
		(this as any).bindActions(tagServerActions);
		(this as any).bindActions(accountServerActions);

		// maps 'namespace/name' => [list of tags]
		(this as any).tags = {};

		// maps 'namespace/name' => true / false
		(this as any).loading = {};
	}

	public tags({repo}) {
		(this as any).loading[repo] = true;
		(this as any).emitChange();
	}

	public localTags({repo, tags}) {
		let data = [];
		tags.map((value) => {
			data.push({name: value});
		});
		(this as any).loading[repo] = true;
		this.tagsUpdated({repo, tags: data || []});
	}

	public tagsUpdated({repo, tags}) {
		this.tags[repo] = tags;
		(this as any).loading[repo] = false;
		(this as any).emitChange();
	}

	public remove({repo}) {
		delete this.tags[repo];
		delete (this as any).loading[repo];
		(this as any).emitChange();
	}

	public loggedout() {
		(this as any).loading = {};
		(this as any).tags = {};
		(this as any).emitChange();
	}

	public error({repo}) {
		(this as any).loading[repo] = false;
		(this as any).emitChange();
	}
}

export default alt.createStore(TagStore);
