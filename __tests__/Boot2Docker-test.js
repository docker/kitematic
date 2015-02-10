jest.dontMock('../src/Boot2Docker');
var boot2docker = require('../src/Boot2Docker');

var fs = require('fs');
var util = require('../src/Util');
var Promise = require('bluebird');

describe('Boot2Docker', () => {
  pit('cli version is parsed correctly', function () {
    util.exec.mockReturnValueOnce(Promise.resolve('Boot2Docker-cli version: v1.4.1\nGit commit: 43241cb'));
    return boot2docker.cliversion().then(version => {
      expect(util.exec).toBeCalledWith([boot2docker.command(), 'version']);
      expect(version).toBe('1.4.1');
    });
  });

  it('iso version parsed correctly', function () {
    fs.readFileSync.mockReturnValueOnce('9adjaldijaslkjd123Boot2Docker-v1.4.1aisudhha82jj123');
    expect(boot2docker.isoversion()).toBe('1.4.1');
  });

  pit('should exist if status command succeeds', function () {
    util.exec.mockReturnValueOnce(Promise.resolve(true));
    return boot2docker.exists().then(exists => {
      expect(util.exec).toBeCalledWith([boot2docker.command(), 'status']);
      expect(exists).toBe(true);
    });
  });

  pit('should not exist if status command fails', function () {
    util.exec.mockReturnValueOnce(Promise.reject(false));
    return boot2docker.exists().then(exists => {
      expect(util.exec).toBeCalledWith([boot2docker.command(), 'status']);
      expect(exists).toBe(false);
    });
  });
});
