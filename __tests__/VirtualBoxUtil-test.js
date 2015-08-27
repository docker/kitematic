jest.dontMock('../src/utils/VirtualBoxUtil');
var virtualBox = require('../src/utils/VirtualBoxUtil');
var util = require('../src/utils/Util');

describe('VirtualBox', function () {
  describe('version 5.0.0r101573', function () {
    pit('correctly parses virtualbox version', function () {
      util.exec.mockImplementation(function () {
        return Promise.resolve('5.0.0r101573');
      });
      return virtualBox.version().then(function (version) {
        expect(version).toBe('5.0.0');
      });
    });
  });
});
