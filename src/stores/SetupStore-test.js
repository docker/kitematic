jest.dontMock('./SetupStore');
var setupStore = require('./SetupStore');
var virtualBox = require('../VirtualBox');
var util = require('../utils/Util');
var machine = require('../DockerMachine');
var setupUtil = require('../utils/SetupUtil');

describe('SetupStore', function () {
  describe('download step', function () {
    util.packagejson.mockReturnValue({});
    pit('downloads virtualbox if it is not installed', function () {
      virtualBox.installed.mockReturnValue(false);
      setupUtil.download.mockReturnValue(Promise.resolve());
      util.packagejson.mockReturnValue({'virtualbox-filename': ''});
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
      util.packagejson.mockReturnValue({'virtualbox-filename': ''});
      util.supportDir.mockReturnValue('');
      return setupStore.steps().download.run().then(() => {
        expect(setupUtil.download).toBeCalled();
      });
    });
  });

  describe('install step', function () {
    util.exec.mockReturnValue(Promise.resolve());
    setupUtil.copyBinariesCmd.mockReturnValue('copycmd');
    setupUtil.fixBinariesCmd.mockReturnValue('fixcmd');
    virtualBox.killall.mockReturnValue(Promise.resolve());
    setupUtil.installVirtualBoxCmd.mockReturnValue('installvb');
    setupUtil.macSudoCmd.mockImplementation(cmd => 'macsudo ' + cmd);

    pit('installs virtualbox if it is not installed', function () {
      virtualBox.installed.mockReturnValue(false);
      util.exec.mockReturnValue(Promise.resolve());
      return setupStore.steps().install.run().then(() => {
        expect(virtualBox.killall).toBeCalled();
        expect(util.exec).toBeCalledWith('macsudo copycmd && fixcmd && installvbcmd');
      });
    });

    pit('only installs binaries if virtualbox is installed', function () {
      virtualBox.installed.mockReturnValue(true);
      setupUtil.compareVersions.mockReturnValue(0);
      setupUtil.needsBinaryFix.mockReturnValue(true);
      return setupStore.steps().install.run().then(() => {
        expect(util.exec).toBeCalledWith('macsudo copycmd && fixcmd');
      });
    });
  });

  describe('init step', function () {
    virtualBox.vmdestroy.mockReturnValue(Promise.resolve());

    pit('upgrades the vm if it exists and is out of date', function () {
      machine.exists.mockReturnValue(Promise.resolve(true));
      machine.state.mockReturnValue(Promise.resolve('Stopped'));
      machine.isoversion.mockReturnValue('1.0');
      machine.stop.mockReturnValue(Promise.resolve());
      machine.start.mockReturnValue(Promise.resolve());
      machine.upgrade.mockReturnValue(Promise.resolve());
      setupUtil.compareVersions.mockReturnValue(-1);
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
