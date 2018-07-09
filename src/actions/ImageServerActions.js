import alt from "../renderer/alt";
class ImageServerActions {
    constructor() {
        this.generateActions("added", "updated", "destroyed", "error");
    }
}
export default alt.createActions(ImageServerActions);
//# sourceMappingURL=ImageServerActions.js.map