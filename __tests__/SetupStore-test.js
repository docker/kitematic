jest.dontMock('../src/stores/SetupStore');
var setupStore = require('../src/stores/SetupStore');
var virtualBox = require('../src/utils/VirtualBoxUtil');
var util = require('../src/utils/Util');
var machine = require('../src/utils/DockerMachineUtil');
var setupUtil = require('../src/utils/SetupUtil');

describe('SetupStore', function () {
  describe('download step', function () {
    util.packagejson.mockReturnValue({});
    pit('downloads virtualbox if it is not installed', function () {
      virtualBox.installed.mockReturnValue(false);
      setupUtil.download.mockReturnValue(Promise.resolve());
      virtualBox.filename.mockReturnValue('');
      util.supportDir.mockReturnValue('');
      return setupStore.steps().download.run().then(() => {
        expect(setupUtil.download).toBeCalled();
      });
    });

    pit('downloads virtualbox if it is installed but has an outdated version', function () {
      virtualBox.installed.mockReturnValue(true);
      virtualBox.version.mockReturnValue(Promise.resolve('4.3.16'));
      util.compareVersions.mockReturnValue(-1);
      setupUtil.download.mockReturnValue(Promise.resolve());
      virtualBox.filename.mockReturnValue('');
      util.supportDir.mockReturnValue('');
      return setupStore.steps().download.run().then(() => {
        expect(setupUtil.download).toBeCalled();
      });
    });
  });

  describe('install step', function () {
    util.exec.mockReturnValue(Promise.resolve());
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
      util.compareVersions.mockReturnValue(0);
      setupUtil.needsBinaryFix.mockReturnValue(true);
      return setupStore.steps().install.run().then(() => {
        expect(setupUtil.copyBinariesCmd).toBeCalled();
        expect(setupUtil.fixBinariesCmd).toBeCalled();
        expect(setupUtil.installVirtualBoxCmd).not.toBeCalled();
      });
    });
  });

  describe('init step', function () {
    pit('upgrades the vm if it exists and is out of date', function () {
      machine.exists.mockReturnValue(Promise.resolve(true));
      machine.state.mockReturnValue(Promise.resolve('Stopped'));
      machine.isoversion.mockReturnValue('1.0');
      machine.stop.mockReturnValue(Promise.resolve());
      machine.start.mockReturnValue(Promise.resolve());
      machine.upgrade.mockReturnValue(Promise.resolve());
      util.compareVersions.mockReturnValue(-1);
      machine.create.mockClear();
      machine.upgrade.mockClear();
      machine.start.mockClear();
      return setupStore.steps().init.run(() => {}).then(() => {
        expect(machine.create).not.toBeCalled();
        expect(machine.upgrade).toBeCalled();
        expect(machine.start).toBeCalled();
      });
    });
  });
});
