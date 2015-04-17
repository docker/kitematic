var fs = require('fs');
var path = require('path');
var dockerode = require('dockerode');
var Promise = require('bluebird');
var util = require('./Util');

var Docker = {
  _host: null,
  _client: null,
  setup: function(ip, name) {
    var certDir = path.join(util.home(), '.docker/machine/machines', name);
    if (!fs.existsSync(certDir)) {
      return;
    }
    this._host = ip;
    this._client = new dockerode({
      protocol: 'https',
      host: ip,
      port: 2376,
      ca: fs.readFileSync(path.join(certDir, 'ca.pem')),
      cert: fs.readFileSync(path.join(certDir, 'cert.pem')),
      key: fs.readFileSync(path.join(certDir, 'key.pem'))
    });
  },
  client: function () {
    return this._client;
  },
  host: function () {
    return this._host;
  },
  waitForConnection: Promise.coroutine(function * (tries, delay) {
    tries = tries || 10;
    delay = delay || 1000;
    var tryCount = 1;
    while (true) {
      try {
        yield new Promise((resolve, reject) => {
          this._client.listContainers((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        break;
      } catch (err) {
        tryCount += 1;
        yield Promise.delay(delay);
        if (tryCount > tries) {
          throw new Error('Cannot connect to the Docker Engine. Either the VM is not responding or the connection may be blocked (VPN or Proxy): ' + err.message);
        }
        continue;
      }
    }
  }),
};

module.exports = Docker;
