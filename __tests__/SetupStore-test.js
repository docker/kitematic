jest.dontMock('../src/SetupStore');
var setupStore = require('../src/SetupStore');
var virtualBox = require('../src/VirtualBox');
var util = require('../src/Util');
var boot2docker = require('../src/Boot2Docker');
var setupUtil = require('../src/SetupUtil');
var Promise = require('bluebird');

describe('SetupStore', function () {
  describe('download step', function () {
    util.packagejson.mockReturnValue({});
    pit('downloads virtualbox if it is not installed', function () {
      virtualBox.installed.mockReturnValue(false);
      setupUtil.download.mockReturnValue(Promise.resolve());
      return setupStore.steps().downloadVirtualBox.run().then(() => {
        // TODO: make sure download was called with the right args
        expect(setupUtil.download).toBeCalled();
      });
    });

    pit('downloads virtualbox if it is installed but has an outdated version', function () {
      virtualBox.installed.mockReturnValue(true);
      virtualBox.version.mockReturnValue(Promise.resolve('4.3.16'));
      setupUtil.compareVersions.mockReturnValue(-1);
      setupUtil.download.mockReturnValue(Promise.resolve());
      return setupStore.steps().downloadVirtualBox.run().then(() => {
        expect(setupUtil.download).toBeCalled();
      });
    });

    pit('skips download if virtualbox is already installed', function () {
      virtualBox.installed.mockReturnValue(true);
      virtualBox.version.mockReturnValue(Promise.resolve('4.3.20'));
      setupUtil.download.mockClear();
      setupUtil.download.mockReturnValue(Promise.resolve());
      setupUtil.compareVersions.mockReturnValue(1);
      return setupStore.steps().downloadVirtualBox.run().then(() => {
        expect(setupUtil.download).not.toBeCalled();
      });
    });
  });

  describe('install step', function () {
    pit('installs virtualbox if it is not installed', function () {
      virtualBox.installed.mockReturnValue(false);
      virtualBox.killall.mockReturnValue(Promise.resolve());
      setupUtil.isSudo.mockReturnValue(Promise.resolve(false));
      util.exec.mockReturnValue(Promise.resolve());
      return setupStore.steps().installVirtualBox.run().then(() => {
        // TODO: make sure that the right install command was executed
        expect(util.exec).toBeCalled();
      });
    });

    pit('installs virtualbox if it is installed but has an outdated version', function () {
      virtualBox.installed.mockReturnValue(true);
      virtualBox.version.mockReturnValue(Promise.resolve('4.3.16'));
      virtualBox.killall.mockReturnValue(Promise.resolve());
      setupUtil.isSudo.mockReturnValue(Promise.resolve(false));
      setupUtil.compareVersions.mockReturnValue(-1);
      util.exec.mockReturnValue(Promise.resolve());
      return setupStore.steps().installVirtualBox.run().then(() => {
        // TODO: make sure the right install command was executed
        expect(virtualBox.killall).toBeCalled();
        expect(util.exec).toBeCalled();
      });
    });

    pit('skips install if virtualbox is already installed', function () {
      virtualBox.installed.mockReturnValue(true);
      virtualBox.version.mockReturnValue(Promise.resolve('4.3.20'));
      setupUtil.isSudo.mockReturnValue(Promise.resolve(false));
      setupUtil.compareVersions.mockReturnValue(-1);
      util.exec.mockReturnValue(Promise.resolve());
      return setupStore.steps().installVirtualBox.run().then(() => {
        virtualBox.killall.mockClear();
        util.exec.mockClear();
        expect(virtualBox.killall).not.toBeCalled();
        expect(util.exec).not.toBeCalled();
      });
    });
  });

  describe('init step', function () {
    virtualBox.vmdestroy.mockReturnValue(Promise.resolve());
    pit('inintializes the boot2docker vm if it does not exist', function () {
      boot2docker.exists.mockReturnValue(Promise.resolve(false));
      boot2docker.init.mockReturnValue(Promise.resolve());
      return setupStore.steps().initBoot2Docker.run().then(() => {
        expect(boot2docker.init).toBeCalled();
      });
    });

    pit('upgrades the boot2docker vm if it exists and is out of date', function () {
      boot2docker.exists.mockReturnValue(Promise.resolve(true));
      boot2docker.isoversion.mockReturnValue('1.0');
      boot2docker.haskeys.mockReturnValue(true);
      boot2docker.stop.mockReturnValue(Promise.resolve());
      boot2docker.upgrade.mockReturnValue(Promise.resolve());
      setupUtil.compareVersions.mockReturnValue(-1);
      return setupStore.steps().initBoot2Docker.run().then(() => {
        boot2docker.init.mockClear();
        expect(boot2docker.init).not.toBeCalled();
        expect(boot2docker.upgrade).toBeCalled();
      });
    });
  });

  describe('start step', function () {
    pit('starts the boot2docker vm if it is not running', function () {
      boot2docker.status.mockReturnValue(false);
      boot2docker.waitstatus.mockReturnValue(Promise.resolve());
      boot2docker.start.mockReturnValue(Promise.resolve());
      return setupStore.steps().startBoot2Docker.run().then(() => {
        expect(boot2docker.start).toBeCalled();
      });
    });
  });
});
