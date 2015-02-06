var virtualbox = require('../build/Virtualbox');
var SetupStore = require('../build/SetupStore');
var setupUtil = require('../build/SetupUtil');
var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var packagejson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000; // 5 minutes for integration tests

describe('Setup', function () {

  describe('with virtualbox installed', function () {

    // Before each teardown the boot2docker VM, keys and anything else

    describe('and with a kitematic vm', function () {

    });

    describe('and without a boot2docker vm', function () {

    });

    describe('and with an old boot2docker vm', function () {

    });

    describe('and with a very old boot2docker vm', function () {

    });

    describe('and with a boot2docker vm running', function () {

    });

    describe('and with a boot2docker vm but with no ssh keys', function () {

    });

    describe('and with a boot2docker vm being powered off', function () {

    });

    describe('and with a boot2docker vm being removed', function () {

    });

    describe('and with a boot2docker vm initialized but not running', function () {

    });
  });

  /*describe('with virtualbox downloaded', function () {
    beforeEach(function (done) {
      Promise.coroutine(SetupStore.downloadVirtualboxStep)().finally(function () {
        if (virtualbox.installed()) {
          virtualbox.kill().finally(function () {
            done();
          });
        } else {
          done();
        }
      });
    });

    it('install virtualbox succeeds', function (done) {
      Promise.coroutine(SetupStore.installVirtualboxStep)().finally(function () {
        expect(virtualbox.installed()).toBe(true);
        done();
      });
    });
  });*/

  /*describe('without virtualbox installed or downloaded', function () {
    var virtualboxFile = path.join(setupUtil.supportDir(), packagejson['virtualbox-filename']);
    beforeEach(function () {
      if (fs.existsSync(virtualboxFile)) {
        fs.unlinkSync(virtualboxFile);
      }
      spyOn(virtualbox, 'installed').and.returnValue(false);
    });

    it('downloads virtualbox from the official website', function (done) {
      Promise.coroutine(SetupStore.downloadVirtualboxStep)().finally(function () {
        expect(fs.existsSync(virtualboxFile)).toBe(true);
        done();
      });
    });
  });*/
});
