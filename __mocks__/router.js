/**
 * Created by thofl on 3/30/2016.
 */
module.exports = {
    get:jest.genMockFunction().mockReturnThis(),
    transitionTo:jest.genMockFunction()
};