var virtualbox = require('../build/Virtualbox');
var SetupStore = require('../build/SetupStore');
var setupUtil = require('../build/SetupUtil');
var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var exec = require('exec');
var rimraf = require('rimraf');
var packagejson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000; // 5 minutes

describe('Setup', function () {
  describe('without virtualbox installed or downloaded', function () {
    var virtualboxFile = path.join(setupUtil.supportDir(), packagejson['virtualbox-filename']);
    beforeEach(function () {
      if (fs.existsSync(virtualboxFile)) {
        fs.unlinkSync(virtualboxFile);
      }
      spyOn(virtualbox, 'installed').andCallFake(function (callback) {
        callback(false);
      });
    });

    it('downloads virtualbox', function (done) {
      SetupStore.downloadVirtualboxStep.run(function (err) {
        expect(err).toBeFalsy();
        expect(fs.existsSync(virtualboxFile)).toBe(true);
        done();
      }, function (progress) {

      });
    });
  });

  describe('with virtualbox downloaded but not installed', function () {
    beforeEach(function (done) {
      // 5 minute timeout per test

      SetupStore.downloadVirtualboxStep.run(function (err) {
        if (virtualbox.installed()) {
          virtualbox.kill(function (callback) {
            done();
          });
        } else {
          done();
        }
      }, function (progress) {});
    });

    it('does install virtualbox', function (done) {
      SetupStore.installVirtualboxStep.run(function (err) {
        expect(err).toBeFalsy();
        done();
      });
    });
  });

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

});
