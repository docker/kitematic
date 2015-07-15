import remote from 'remote';
var app = remote.require('app');
import fs from 'fs';
import util from './Util';
import path from 'path';
import bugsnag from 'bugsnag-js';
import metrics from './MetricsUtil';

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
        if (!metrics.enabled()) {
          return false;
        }

        payload.stacktrace = util.removeSensitiveData(payload.stacktrace);
        payload.context = util.removeSensitiveData(payload.context);
        payload.file = util.removeSensitiveData(payload.file);
        payload.message = util.removeSensitiveData(payload.message);
        payload.url = util.removeSensitiveData(payload.url);
        payload.name = util.removeSensitiveData(payload.name);
        payload.file = util.removeSensitiveData(payload.file);

        for(var key in payload.metaData) {
          payload.metaData[key] = util.removeSensitiveData(payload.metaData[key]);
        }
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
