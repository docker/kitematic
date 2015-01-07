var fs = require('fs');

Meteor.startup(function () {
  console.log('Kitematic started.');

  [Util.KITE_PATH, Util.KITE_TAR_PATH, Util.KITE_IMAGES_PATH, Util.getAppSupportDir(), Util.getResourceDir(), Util.getDataDir(), Util.getMetricsDir()].forEach(function (d) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d);
    }
  });

  Metrics.prepareTracking(function() {
    Metrics.trackEvent('app started');
    Metrics.trackEvent('app heartbeat');
    Meteor.setInterval(function () {
      Metrics.trackEvent('app heartbeat');
    }, 14400000);
  });

  Boot2Docker.ip(function (err, ip) {
    if (!err) {
      console.log('Setting host IP to: ' + ip);
      Docker.setHost(ip);
    }
  });
});
