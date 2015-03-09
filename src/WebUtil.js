var app = require('remote').require('app');
var fs = require('fs');
var util = require('./Util');
var path = require('path');
var bugsnag = require('bugsnag-js');

var WebUtil = {
  addWindowSizeSaving: function () {
    window.addEventListener('resize', function () {
      fs.writeFileSync(path.join(util.supportDir(), 'size'), JSON.stringify({
        width: window.outerWidth,
        height: window.outerHeight
      }));
    });
  },
  addLiveReload: function () {
    if (process.env.NODE_ENV === 'development') {
      var head = document.getElementsByTagName('head')[0];
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'http://localhost:35729/livereload.js';
      head.appendChild(script);
    }
  },
  addBugReporting: function () {
    var settingsjson = util.settingsjson();
    if (settingsjson.bugsnag) {
      bugsnag.apiKey = settingsjson.bugsnag;
      bugsnag.autoNotify = true;
      bugsnag.releaseStage = process.env.NODE_ENV === 'development' ? 'development' : 'production';
      bugsnag.notifyReleaseStages = ['production'];
      bugsnag.appVersion = app.getVersion();
      bugsnag.metaData = {
        beta: !!settingsjson.beta
      };

      bugsnag.beforeNotify = function(payload) {
        var re = new RegExp(util.home().replace(/\s+/g, '\\s+'), 'g');
        payload.stacktrace = payload.stacktrace.replace(/%20/g, ' ').replace(re, '<redacted homedir>');
        payload.context = payload.context.replace(/%20/g, ' ').replace(re, '<redacted homedir>');
        payload.file = payload.file.replace(/%20/g, ' ').replace(re, '<redacted homedir>');
        payload.url = '<redacted url>';
      };
    }
  },
  disableGlobalBackspace: function () {
    document.onkeydown = function (e) {
      e = e || window.event;
      var doPrevent;
      if (e.keyCode === 8) {
        var d = e.srcElement || e.target;
        if (d.tagName.toUpperCase() === 'INPUT' || d.tagName.toUpperCase() === 'TEXTAREA') {
          doPrevent = d.readOnly || d.disabled;
        } else {
          doPrevent = true;
        }
      } else {
        doPrevent = false;
      }
      if (doPrevent) {
        e.preventDefault();
      }
    };
  },
};

module.exports = WebUtil;
