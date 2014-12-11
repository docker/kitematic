var remote = require('remote');
var app = remote.require('app');
var crypto = require('crypto');
var uuid = require('node-uuid');
var level = require('levelup');
var path = require('path');
var db = level(path.join(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'], 'Library/Application Support/Kitematic/data', 'db'));

Metrics = {};

Metrics.enable = function () {
  db.put('metrics.enabled', true);
};

Metrics.disable = function () {
  db.put('metrics.enabled', false);
};

Metrics.enabled = function (callback) {
  db.get('metrics.enabled', function (err, value) {
    if (err) {
      callback(false);
    } else {
      callback(value);
    }
  });
};

Metrics.trackEvent = function (name) {
  if (!name) {
    return;
  }
  db.get('metrics.enabled', function (err, value) {
    if (err || !value) {
      return;
    }
    db.get('metrics.uuid', function (err, uuid) {
      if (err) {
        return;
      }
      mixpanel.track('docker_gui ' + name, {
        distinct_id: uuid,
        version: app.getVersion()
      });
    });
  });
};

Metrics.prepareTracking = function () {
  db.get('metrics.enabled', function (err, value) {
    if (err && err.notFound) {
      var settings = Settings.findOne();
      if (settings && settings.tracking) {
        db.put('metrics.enabled', !!settings.tracking);
      } else {
        db.put('metrics.enabled', true);
      }
    }
    db.get('metrics.uuid', function (err, value) {
      if (err && err.notFound) {
        db.put('metrics.uuid', uuid.v4());
      }
    });
  });
};
