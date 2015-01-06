var remote = require('remote');
var app = remote.require('app');
var crypto = require('crypto');
var uuid = require('node-uuid');
var path = require('path');
var fs = require('fs');

var level = require('levelup');
var db;

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
      var osVersion = navigator.userAgent.match(/Mac OS X (\d+_\d+_\d+)/)[1].replace(/_/g, '.');
      mixpanel.track(name, {
        distinct_id: uuid,
        version: app.getVersion(),
        product: 'Docker GUI',
        'Operating System Version': osVersion
      });
    });
  });
};

Metrics.prepareUUID = function (callback) {
  db.get('metrics.uuid', function (err, value) {
    if (err && err.notFound) {
      db.put('metrics.uuid', uuid.v4(), function (err) {
        callback();
      });
    } else {
      callback();
    }
  });
});

Metrics.prepareTracking = function (callback) {
  db = level(Util.getMetricsDir());
  db.get('metrics.enabled', function (err, value) {
    if (err && err.notFound) {
      var settings = Settings.findOne();
      if (settings && settings.tracking) {
        db.put('metrics.enabled', !!settings.tracking, function(err) {
          Metrics.prepareUUID(callback);
        });
      } else {
        db.put('metrics.enabled', true, function (err) {
          Metrics.prepareUUID(callback);
        });
      }
    } else {
      Metrics.prepareUUID(callback);
    }
  });
};
