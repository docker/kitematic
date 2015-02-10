jest.dontMock('../src/Virtualbox');
var virtualbox = require('../src/Virtualbox');
var util = require('../src/Util');
var Promise = require('bluebird');

describe('Virtualbox', function () {
  it('returns the right command', function () {
    expect(virtualbox.command()).toBe('/usr/bin/VBoxManage');
  });

  describe('version 4.3.20r96996', function () {
    pit('correctly parses virtualbox version', function () {
      util.exec.mockImplementation(function () {
        return Promise.resolve('4.3.20r96996');
      });
      return virtualbox.version().then(function (version) {
        expect(version).toBe('4.3.20');
      });
    });
  });
});
