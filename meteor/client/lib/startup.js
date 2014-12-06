var fs = require('fs');

Meteor.startup(function () {
  console.log('Kitematic started.');
  if (!fs.existsSync(Util.KITE_PATH)) {
    console.log('Created Kitematic directory.');
    fs.mkdirSync(Util.KITE_PATH);
  }
  if (!fs.existsSync(Util.KITE_TAR_PATH)) {
    console.log('Created Kitematic .tar directory.');
    fs.mkdirSync(Util.KITE_TAR_PATH);
  }
  if (!fs.existsSync(Util.KITE_IMAGES_PATH)) {
    console.log('Created Kitematic .images directory.');
    fs.mkdirSync(Util.KITE_IMAGES_PATH);
  }
  if (!fs.existsSync(Util.getResourceDir())) {
    fs.mkdirSync(Util.getResourceDir());
  }

  Metrics.prepareTracking();
  Metrics.trackEvent('app started');
  Metrics.trackEvent('app heartbeat');
  Meteor.setInterval(function () {
    Metrics.trackEvent('app heartbeat');
  }, 14400000);

  Boot2Docker.ip(function (err, ip) {
    if (!err) {
      console.log('Setting host IP to: ' + ip);
      Docker.setHost(ip);
    }
  });
});
