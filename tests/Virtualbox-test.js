var virtualbox = require('../build/Virtualbox');
var util = require('../build/Util');
var Promise = require('bluebird');

describe('Virtualbox', function () {
  it('returns the right command', function () {
    expect(virtualbox.command()).toBe('/usr/bin/VBoxManage');
  });

  describe('version 4.3.20r96996', function () {
    beforeEach(function () {
      spyOn(util, 'exec').and.returnValue(Promise.resolve('4.3.20r96996'));
    });
    it('correctly parses virtualbox version', function (done) {
      virtualbox.version().then(function (version) {
        expect(version).toBe('4.3.20');
        done();
      });
    });
  });
});
