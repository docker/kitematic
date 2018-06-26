import alt from "../renderer/alt";
class AccountServerActions {
    constructor() {
        this.generateActions("signedup", "loggedin", "loggedout", "prompted", "errors", "verified");
    }
}
export default alt.createActions(AccountServerActions);
//# sourceMappingURL=AccountServerActions.js.map