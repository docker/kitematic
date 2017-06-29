module.exports = {
  require: jest.genMockFunction(),
  match: jest.genMockFunction(),
  app: jest.genMockFunction(),
  remote:{
    getCurrentWindow: jest.genMockFunction().mockReturnThis(),
    hide:jest.genMockFunction(),
    toggleDevTools:jest.genMockFunction()
  },
  dialog: jest.genMockFunction()
};
