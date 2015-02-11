jest.dontMock('../src/Virtualbox');
var virtualBox = require('../src/Virtualbox');
var util = require('../src/Util');
var Promise = require('bluebird');

describe('VirtualBox', function () {
  it('returns the right command', function () {
    expect(virtualBox.command()).toBe('/usr/bin/VBoxManage');
  });

  describe('version 4.3.20r96996', function () {
    pit('correctly parses virtualbox version', function () {
      util.exec.mockImplementation(function () {
        return Promise.resolve('4.3.20r96996');
      });
      return virtualBox.version().then(function (version) {
        expect(version).toBe('4.3.20');
      });
    });
  });
});
