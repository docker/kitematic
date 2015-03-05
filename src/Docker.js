var fs = require('fs');
var path = require('path');
var dockerode = require('dockerode');

var Docker = {
  _host: null,
  _client: null,
  setup: function(ip, name) {
    var certDir = path.join(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'], '.docker/machine/machines', name);
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
  }
};

module.exports = Docker;
