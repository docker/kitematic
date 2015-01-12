var fs = require('fs');
var path = require('path');
var dockerode = require('dockerode');

var Docker = {
  host: null,
  setHost: function(host) {
    this.host = host;
  },
  client: function () {
    var certDir = path.join(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'], '.boot2docker/certs/boot2docker-vm');
    if (!fs.existsSync(certDir)) {
      return null;
    }
    return new dockerode({
      protocol: 'https',
      host: this.host,
      port: 2376,
      ca: fs.readFileSync(path.join(certDir, 'ca.pem')),
      cert: fs.readFileSync(path.join(certDir, 'cert.pem')),
      key: fs.readFileSync(path.join(certDir, 'key.pem'))
    });
  }
};

module.exports = Docker;
