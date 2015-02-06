var virtualbox = require('../build/Virtualbox');
var util = require('../build/Util');

describe('Virtualbox', function () {
  beforeAll(function () {
    // Make sure VirtualBox is installed
  });

  describe('with a running VM', function () {
    beforeEach(function (done) {
      return util.exec([virtualbox.command(), 'createvm', '--name', 'km-test', '--register']).finally(function () {
        return util.exec([virtualbox.command(), 'startvm', 'km-test', '--type', 'headless']);
      }).then(function() {
        done();
      }).catch(function () {
        done();
      });
    });

    it('powers off all vms', function (done) {
      virtualbox.poweroffall().then(function () {
        return virtualbox.vmstate('km-test');
      }).then(function (state) {
        expect(state).toBe('poweroff');
        done();
      }).catch(function (err) {
        expect(err).toBeFalsy();
        done();
      });
    });

    it('destroys a vm', function (done) {
      virtualbox.vmdestroy('km-test').then(function () {
        return util.exec([virtualbox.command(), 'showvminfo', 'km-test']).then(function () {
          done();
        }).catch(function (err) {
          expect(err).toBeTruthy();
          done();
        });
      }).catch(function (err) {
        console.log(err);
        done();
      });
    });

    afterEach(function (done) {
      util.exec([virtualbox.command(), 'controlvm', 'km-test', 'poweroff']).finally(function () {
        return util.exec([virtualbox.command(), 'unregistervm', 'km-test', '--delete']);
      }).then(function () {
        done();
      }).catch(function () {
        done();
      });
    });
  });
});
