var boot2docker = require('../build/Boot2Docker');
var path = require('path');
var fs = require('fs');
var packagejson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

describe('Boot2Docker', () => {
  it('cli version is correct', done => {
    boot2docker.cliversion().then(version => {
      expect(version).toBe(packagejson['boot2docker-version']);
      done();
    });
  });

  describe('with an existing & running boot2docker vm', () => {
    beforeAll(done => {
      boot2docker.init().then(boot2docker.start).then(() => {
        done();
      });
    });

    it('creates a vm', done => {
      boot2docker.exists().then(exists => {
        expect(exists).toBe(true);
        done();
      });
    });

    it('detects the correct state of running vm', done => {
      boot2docker.status().then(status => {
        expect(status).toBe('running');
        done();
      });
    });

    it('detects ssh keys', () => {
      expect(boot2docker.haskeys()).toBe(true);
    });

    it('receives an ip address from the vm', done => {
      boot2docker.ip().then(ip => {
        expect(ip).toMatch(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
        done();
      });
    });

    it('reads a version from the boot2docker iso file', done => {
      boot2docker.isoversion().then(version => {
        expect(version).toMatch(/\d+\.\d+\.\d+/);
        done();
      });
    });

    afterAll(done => {
      boot2docker.destroy().finally(done);
    });
  });
});
