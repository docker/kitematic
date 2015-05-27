jest.dontMock('../src/utils/URLUtil');
jest.dontMock('parseUri');
var urlUtil = require('../src/utils/URLUtil');
var util = require('../src/utils/Util');

describe('URLUtil', function () {
  beforeEach(() => {
    util.compareVersions.mockClear();
    util.isOfficialRepo.mockClear();
  });

  it('does nothing if the url is undefined', () => {
    util.compareVersions.mockReturnValue(1);
    util.isOfficialRepo.mockReturnValue(true);
    expect(urlUtil.openUrl()).toBe(false);
  });

  it('does nothing if the flags object is undefined', () => {
    util.compareVersions.mockReturnValue(1);
    util.isOfficialRepo.mockReturnValue(true);
    expect(urlUtil.openUrl('docker://repository/run/redis')).toBe(false);
  });

  it('does nothing if the url enabled flag is falsy', () => {
    util.compareVersions.mockReturnValue(1);
    util.isOfficialRepo.mockReturnValue(true);
    expect(urlUtil.openUrl('docker://repository/run/redis', {dockerURLEnabledVersion: undefined})).toBe(false);
  });

  it('does nothing if the url enabled flag version is higher than the app version', () => {
    util.compareVersions.mockReturnValue(-1);
    util.isOfficialRepo.mockReturnValue(true);
    expect(urlUtil.openUrl('docker://repository/run/redis', {dockerURLEnabledVersion: '0.5.19'}, '0.5.18')).toBe(false);
  });

  it('does nothing if the type is not in the whitelist', () => {
    util.compareVersions.mockReturnValue(1);
    util.isOfficialRepo.mockReturnValue(true);
    expect(urlUtil.openUrl('docker://badtype/run/redis', {dockerURLEnabledVersion: '0.5.19'}, '0.5.18')).toBe(false);
  });

  it('does nothing if the method is not in the whitelist', () => {
    util.compareVersions.mockReturnValue(1);
    util.isOfficialRepo.mockReturnValue(true);
    expect(urlUtil.openUrl('docker://repository/badmethod/redis', {dockerURLEnabledVersion: '0.5.19'}, '0.5.18')).toBe(false);
  });

  it('does nothing if protocol is not docker:', () => {
    util.compareVersions.mockReturnValue(1);
    util.isOfficialRepo.mockReturnValue(true);
    expect(urlUtil.openUrl('facetime://')).toBe(false);
  });

  it('does nothing if repo is not official', () => {
    util.compareVersions.mockReturnValue(1);
    util.isOfficialRepo.mockReturnValue(false);
    expect(urlUtil.openUrl('docker://repository/run/not/official', {dockerURLEnabledVersion: '0.5.19'}, '0.5.20')).toBe(false);
  });

  it('returns true if type and method are correct', () => {
    util.compareVersions.mockReturnValue(1);
    util.isOfficialRepo.mockReturnValue(true);
    expect(urlUtil.openUrl('docker://repository/run/redis', {dockerURLEnabledVersion: '0.5.19'}, '0.5.20')).toBe(true);
  });
});
