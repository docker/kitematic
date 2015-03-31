jest.dontMock('../src/SetupStore');
var setupStore = require('../src/SetupStore');
var virtualBox = require('../src/VirtualBox');
var util = require('../src/Util');
var machine = require('../src/DockerMachine');
var setupUtil = require('../src/SetupUtil');
var Promise = require('bluebird');

describe('SetupStore', function () {
  describe('download step', function () {
    util.packagejson.mockReturnValue({});
    pit('downloads virtualbox if it is not installed', function () {
      virtualBox.installed.mockReturnValue(false);
      setupUtil.download.mockReturnValue(Promise.resolve());
      setupUtil.virtualBoxFileName.mockReturnValue('');
      util.supportDir.mockReturnValue('');
      return setupStore.steps().download.run().then(() => {
        expect(setupUtil.download).toBeCalled();
      });
    });

    pit('downloads virtualbox if it is installed but has an outdated version', function () {
      virtualBox.installed.mockReturnValue(true);
      virtualBox.version.mockReturnValue(Promise.resolve('4.3.16'));
      setupUtil.compareVersions.mockReturnValue(-1);
      setupUtil.download.mockReturnValue(Promise.resolve());
      setupUtil.virtualBoxFileName.mockReturnValue('');
      util.supportDir.mockReturnValue('');
      return setupStore.steps().download.run().then(() => {
        expect(setupUtil.download).toBeCalled();
      });
    });
  });

  describe('install step', function () {
    util.exec.mockReturnValue(Promise.resolve());
    util.execProper.mockReturnValue(Promise.resolve());
    setupUtil.copyBinariesCmd.mockReturnValue(Promise.resolve());
    setupUtil.fixBinariesCmd.mockReturnValue(Promise.resolve());
    virtualBox.killall.mockReturnValue(Promise.resolve());
    setupUtil.installVirtualBoxCmd.mockReturnValue(Promise.resolve());
    setupUtil.macSudoCmd.mockImplementation(cmd => 'macsudo ' + cmd);

    pit('installs virtualbox if it is not installed', function () {
      virtualBox.installed.mockReturnValue(false);
      util.exec.mockReturnValue(Promise.resolve());
      return setupStore.steps().install.run().then(() => {
        expect(virtualBox.killall).toBeCalled();
        expect(setupUtil.copyBinariesCmd).toBeCalled();
        expect(setupUtil.fixBinariesCmd).toBeCalled();
        expect(setupUtil.installVirtualBoxCmd).toBeCalled();
      });
    });

    pit('only installs binaries if virtualbox is installed', function () {
      virtualBox.installed.mockReturnValue(true);
      setupUtil.compareVersions.mockReturnValue(0);
      setupUtil.needsBinaryFix.mockReturnValue(true);
      return setupStore.steps().install.run().then(() => {
        expect(setupUtil.copyBinariesCmd).toBeCalled();
        expect(setupUtil.fixBinariesCmd).toBeCalled();
        expect(setupUtil.installVirtualBoxCmd).not.toBeCalled();
      });
    });
  });

  describe('init step', function () {
    virtualBox.vmdestroy.mockReturnValue(Promise.resolve());
    pit('inintializes the machine vm if it does not exist', function () {
      util.home.mockReturnValue('home');
      machine.name.mockReturnValue('name');
      machine.exists.mockReturnValue(Promise.resolve(false));
      machine.create.mockReturnValue(Promise.resolve());
      return setupStore.steps().init.run().then(() => {
        expect(machine.create).toBeCalled();
      });
    });

    pit('upgrades the vm if it exists and is out of date', function () {
      machine.exists.mockReturnValue(Promise.resolve(true));
      machine.state.mockReturnValue(Promise.resolve('Stopped'));
      machine.isoversion.mockReturnValue('1.0');
      machine.stop.mockReturnValue(Promise.resolve());
      machine.start.mockReturnValue(Promise.resolve());
      machine.regenerateCerts.mockReturnValue(Promise.resolve());
      machine.upgrade.mockReturnValue(Promise.resolve());
      setupUtil.compareVersions.mockReturnValue(-1);
      machine.create.mockClear();
      machine.upgrade.mockClear();
      machine.stop.mockClear();
      machine.start.mockClear();
      machine.regenerateCerts.mockClear();
      return setupStore.steps().init.run(() => {}).then(() => {
        expect(machine.create).not.toBeCalled();
        expect(machine.stop).toBeCalled();
        expect(machine.upgrade).toBeCalled();
        expect(machine.regenerateCerts).toBeCalled();
        expect(machine.start).toBeCalled();
      });
    });
  });
});
