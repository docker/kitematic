var setupUtil = require('../build/SetupUtil');

describe('SetupUtils', function() {
  it('returns live sha256 checksum for a given virtualbox version & filename', function (done) {
    setupUtil.virtualboxSHA256('4.3.20', 'VirtualBox-4.3.20-96996-OSX.dmg', function (err, checksum) {
      expect(checksum).toBe('744e77119a640a5974160213c9912568a3d88dbd06a2fc6b6970070941732705');
      done();
    });
  });
});
