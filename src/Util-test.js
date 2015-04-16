jest.dontMock('./Util');
var util = require('./Util');

describe('Util', function () {
  it('accepts official repo', () => {
    expect(util.isOfficialRepo('redis')).toBe(true);
  });

  it('rejects falsy value as official repo', () => {
    expect(util.isOfficialRepo(undefined)).toBe(false);
  });

  it('rejects empty repo name', () => {
    expect(util.isOfficialRepo('')).toBe(false);
  });

  it('rejects repo with non official namespace', () => {
    expect(util.isOfficialRepo('kitematic/html')).toBe(false);
  });

  it('rejects repo with a different registry address', () => {
    expect(util.isOfficialRepo('www.myregistry.com/kitematic/html')).toBe(false);
  });
});
