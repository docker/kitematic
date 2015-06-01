jest.dontMock('../src/utils/Util');
var util = require('../src/utils/Util');

describe('Util', function () {
  describe('when removing sensitive data', function () {
    it('filters ssh certificate data', function () {
      var testdata = String.raw`time="2015-04-17T21:43:47-04:00" level="debug" msg="executing: ssh -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectionAttempts=30 -o LogLevel=quiet -p 50483 -i /Users/johnappleseed/.docker/machine/machines/dev2/id_rsa docker@localhost sudo mkdir -p /var/lib/boot2docker" time="2015-04-17T21:43:47-04:00" level="debug" msg="executing: ssh -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectionAttempts=30 -o LogLevel=quiet -p 50483 -i /Users/johnappleseed/.docker/machine/machines/dev2/id_rsa docker@localhost echo \"-----BEGIN CERTIFICATE-----\nMIIC+DCCAeKgAwIBAgIRANfIbsa2M94gDY+fBiBiQBkwCwYJKoZIhvcNAQELMBIx\nEDAOBgNVBAoTB2ptb3JnYW4wHhcNMTUwNDE4MDEzODAwWhcNMTgwNDAyMDEzODAw\nWjAPMQ0wCwYDVQQKEwRkZXYyMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC\nAQEA1yamWT0bk0pRU7eiStjiXe2jkzdeI0SdJZo+bjczkl6kzNW/FmR/OkcP8gHX\nCO3fUCWkR/+rBgz3nuM1Sy0BIUo0EMQGfx17OqIJPXO+BrpCHsXlphHmbQl5bE2Y\nF+bAsGc6WCippw/caNnIHRsb6zAZVYX2AHLYY0fwIDAQABo1AwTjAOBgNVHQ8BAf8EBAMCAKAwHQYD\nVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMAwGA1UdEwEB/wQCMAAwDwYDVR0R\nBAgwBocEwKhjZTALBgkqhkiG9w0BAQsDggEBAKBdD86+kl4X1VMjgGlNYnc42tWa\nbo1iDl/frxiLkfPSc2McAOm3AqX1ao+ynjqq1XTlBLPTQByu/oNZgA724LRJDfdG\nCKGUV8latW7rB1yhf/SZSmyhNjufuWlgCtbkw7Q/oPddzYuSOdDW8tVok9gMC0vL\naqKCWfVKkCmvGH+8/wPrkYmro/f0uwJ8ee+yrbBPlBE/qE+Lqcfr0YcXEDaS8CmL\nDjWg7KNFpA6M+/tFNQhplbjwRsCt7C4bzQu0aBIG5XH1Jr2HrKlLjWdmluPHWUL6\nX5Vh1bslYJzsSdBNZFWSKShZ+gtRpjtV7NynANDJPQNIRhDxAf4uDY9hA2c=\n-----END CERTIFICATE-----\n\" | sudo tee /var/lib/boot2docker/server.pem"
  time="2015-04-17T21:43:47-04:00" level="debug" msg="executing: /usr/bin/VBoxManage showvminfo dev2 --machinereadable"`;
      expect(util.removeSensitiveData(testdata).indexOf('CERTIFICATE')).toEqual(-1);
      expect(util.removeSensitiveData(testdata).indexOf('nX5Vh1bslYJzsSdBNZFWSKShZ+gtRpjtV7NynANDJPQNIRhDxAf4uDY9hA2c')).toEqual(-1);
      expect(util.removeSensitiveData(testdata).indexOf('<redacted>')).toNotEqual(-1);
    });

    it('filters ssh private key data', function () {
      var testdata = String.raw`hZbuxglOtQv2AQqOp/luhZ3Y8kDs4cqRzoA1o+k+LAyjEb+Nk\nGA8=\n-----END CERTIFICATE-----\n\" | sudo tee /var/lib/boot2docker/ca.pem"
  time="2015-04-17T21:43:47-04:00" level="debug" msg="executing: ssh -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectionAttempts=30 -o LogLevel=quiet -p 50483 -i /Users/johnappleseed/.docker/machine/machines/dev2/id_rsa docker@localhost echo \"-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA1yamWT0bk0pRU7eiStjiXe2jkzdeI0SdJZo+bjczkl6kzNW/\nFmR/OkcP8gHXCO3fUCWkR/+rBgz3nuM1Sy0BIUo0EMQGfx17OqIJPXO+BrpCHsXl\nphHmbQl5bE2YF+bAsGc6WCippczQIu5bPweeAkR1WdlkhD08tHD4o1ESe09fXx5G\nXcZFfd2xQWdvAJX3fTuGBk3IMEF2fye5b69zUyVDGbTylyjKDOi9Xxdlc4y9cOPw\nzcwQFCOJiCBYlxDO0fbinA+KigCs29Dd5U3oXbloLr3JQTE/SkxFh9W5rkX8ysY4\n2h3EnR7YIBWt/caNnIHRsb6zAZVYX2AHLYY0fwIDAQABAoIBAQDKF3TTh/G59WnU\n4D2iXnyqy8gFRVG4gP+3TV3s+w8HIr1b5j6akwVqwUs5//5zVbSYPPNF6eJESbPi\nW/s4ROq10VR8lxSfHBsfJQrW3TwWZ6gp7atbxZ6Stv6F+5CsisReLmiAXJmVsn+j\nAA9Xchk6egFcxzWCfV7jAuaZyVI53cclepm/xkGjPwrfXr+nA+UMvO6DllC6IcBF\no4+O0jVtzdMecZnQk6nWxNJjurodTTQakrNAqSMgBshn48wf3N35b+p8RtTzLJ8L\nYuHkv6OKMITIazcHadjsN8icGgIGf2BJ1CRje7j0Yzow8jwY+Pet3yxKSfXED89B\nD34AEXl5AoGBANi17og+yPFOWURUrksO/QyzlOtXcQdQu8SmkUj4ACoqF0gegQIb\nC/DNMcYxJAsPPgw/t5Ws/af8DuatYguGukmekYREVjc7DS/hPWDZzeavPd95cOw0\nuMPgJE76HJ3BSYcp1f8WKcN+xDket9CF6Qz+VX5aQSUEc333V5h7D/nzAoGBAP4o\nVCvQu5eKYmDhMFSOA0+Qm3EECRqMLoH6kpEcbMjM8+kOeI0fUuE3CX8nzs7P4py/\n0IFj2Yxl578NHJOjCpbB1UKtxLkmDH42wXXzrWJXRaWXC93dh1sl0aB6qE25FtSD\nzjYh4y1DA/t6y95YRrIqC2WhIU7eigIoujmtOFJFAoGABSKiiWX7ewRhRyY+jxbG\n1lM3FzCWRBccq/dKgBEoZ9dhf9sBMZyUdttV751gfkaZMM8duZVE2YM2ky7OoPlL\nVs1EI38/D8X9dQIAY1gl8e57J92H2IETU8ju81Qn83EOHf7WzFmpGbHaUoQw1Ocn\nc6BfREQ9QPRPDFAdKkbYRRMCgYEAl44k4xvNQUhb8blWwJUOlFt+1Z26cAI3mXp5\n+94fYH4W1Fq0uDJ9kZ7oItLyF5EPaLlY9E8+YuJBl0OSTtdicROUv/Yu4Nk3ievM\n4TE1qvavqVaw1NRM6qVao3+A7Rf57S/Lv6vldBAKR+OpviSVw5gew7OZ0RYS5caz\nhcEtXKECgYAJb7t67nococm0PsRe8Xv1SQOQjetrhzwzD1PLOSC9TrzwA22/ZktZ\neu/qfvYgOPT4LkDGVCzn8J+TAcUVnIvAnJRQTsBu55uiL8YC5jZQ8E1hBf7kskMq\nh16WD19Djv3WhfBNXBxvnagDDWw5DxmiiKzSf0k3QDDoX7wjDAV1dQ==\n-----END RSA PRIVATE KEY-----\n\" | sudo tee /var/lib/boot2docker/server-key.pem"
  time="2015-04-17T21:43:47-04:00" level="debug" msg="executing: ssh -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectionAttempts=30 -o LogLevel=quiet -p 50483 -i /Users/johnappleseed/.docker/machine/machines/dev2/id_rsa docker@localhost echo \"-----BEGIN CERTIFICATE-----\nMIIC+DCCAeKgAwIBAgIRANfIbsa2M94gDY+fBiBiQBkwCwYJKoZIhvcNAQELMBIx\nEDAOBg`;
      expect(util.removeSensitiveData(testdata).indexOf('PRIVATE')).toEqual(-1);
      expect(util.removeSensitiveData(testdata).indexOf('94fYH4W1Fq0uDJ9kZ7oItLyF5EPaLlY9E8+YuJBl0OSTtdicROUv')).toEqual(-1);
      expect(util.removeSensitiveData(testdata).indexOf('<redacted>')).toNotEqual(-1);
    });

    it('filters username data', function () {
      var testdata = String.raw`/Users/johnappleseed/.docker/machine/machines/dev2/id_rsa docker@localhost echo`;
      expect(util.removeSensitiveData(testdata).indexOf('/Users/johnappleseed/')).toEqual(-1);
      expect(util.removeSensitiveData(testdata).indexOf('/Users/<redacted>/')).toNotEqual(-1);

      testdata = String.raw`/Users/some.wei-rdUsername/.docker/machine/machines/dev2/id_rsa docker@localhost echo`;
      expect(util.removeSensitiveData(testdata).indexOf('/Users/some.wei-rdUsername/.docker')).toEqual(-1);
      expect(util.removeSensitiveData(testdata).indexOf('/Users/<redacted>/.docker')).toNotEqual(-1);
    });

    it ('returns input if empty or not a string', function () {
      expect(util.removeSensitiveData('')).toBe('');
      expect(util.removeSensitiveData(1)).toBe(1);
      expect(util.removeSensitiveData(undefined)).toBe(undefined);
    });
  });

  describe('when verifying that a repo is official', function () {
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
});
