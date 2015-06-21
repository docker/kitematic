var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var machine = require('../../utils/DockerMachineUtil');
var setupUtil = require('../../utils/SetupUtil');
var util = require('../../utils/Util');
var SetupStore = require('../SetupStore.js');
var request = require('request');
var NAME = "digitalocean";

var _currentStep = null;
var _error = null;
var _cancelled = false;
var _retryPromise = null;
var _requiredSteps = [];

var _steps = [{
  name: 'check',
  title: 'Checking Digital Ocean',
  message: 'Kitematic is checking your Digital Ocean credentials. Please make sure your token is registered.',
  totalPercent: 35,
  percent: 0,
  seconds: 60,
  run: Promise.coroutine(function* (progressCallback) {
    var DIGITAL_OCEAN_ACCESS_TOKEN = localStorage.getItem('settings.digitalocean-access-token');
    var options = {
      url: 'https://api.digitalocean.com/v2/account',
      headers: {
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + DIGITAL_OCEAN_ACCESS_TOKEN
      }
    };
    request(options, function(error, response, body){
      if (!error && response.statusCode == 200){
        return;
      }
      throw null;
    });
  })
}, {
  name: 'init',
  title: 'Installing Docker on Digital Ocean',
  message: 'Kitematic is installing Docker components on Digital Ocean. Please wait...',
  totalPercent: 50,
  percent: 0,
  run: Promise.coroutine(function* (progressCallback) {
    var DIGITAL_OCEAN_ACCESS_TOKEN = localStorage.getItem('settings.digitalocean-access-token');
    setupUtil.simulateProgress(this.seconds, progressCallback);
    var exists = yield machine.exists();
    if (!exists || (yield machine.state()) === 'Error') {
      if (exists && (yield machine.state()) === 'Error') {
        yield machine.rm();
      }
      yield machine.create(NAME, ["--digitalocean-access-token", DIGITAL_OCEAN_ACCESS_TOKEN]);
      return;
    }

    var isoversion = machine.isoversion();
    var packagejson = util.packagejson();
    if (!isoversion || util.compareVersions(isoversion, packagejson['docker-version']) < 0) {
      yield machine.start();
      yield machine.upgrade();
    }
    if ((yield machine.state()) !== 'Running') {
      yield machine.start();
    }
  })
}];
var SetupStore = assign(Object.create(EventEmitter.prototype), {
  PROGRESS_EVENT: 'setup_progress',
  STEP_EVENT: 'setup_step',
  ERROR_EVENT: 'setup_error',
  step: function () {
    return _currentStep;
  },
  steps: function () {
    return _.indexBy(_steps, 'name');
  },
  stepCount: function () {
    return _requiredSteps.length;
  },
  number: function () {
    return _.indexOf(_requiredSteps, _currentStep) + 1;
  },
  percent: function () {
    var sofar = 0;
    var totalPercent = _requiredSteps.reduce((prev, step) => prev + step.totalPercent, 0);
    _.each(_requiredSteps, step => {
      sofar += step.totalPercent * step.percent / 100;
    });
    return Math.min(Math.round(100 * sofar / totalPercent), 99);
  },
  error: function () {
    return _error;
  },
  cancelled: function () {
    return _cancelled;
  },
  retry: function (remove) {
    _error = null;
    _cancelled = false;
    if (!_retryPromise) {
      return;
    }
    this.emit(this.ERROR_EVENT);
    if (remove) {
      machine.rm().finally(() => {
        _retryPromise.resolve();
      });
    } else {
      machine.stop().finally(() => {
        _retryPromise.resolve();
      });
    }
  },
  setError: function (error) {
    _error = error;
    this.emit(this.ERROR_EVENT);
  },
  pause: function () {
    _retryPromise = Promise.defer();
    return _retryPromise.promise;
  },
  requiredSteps: Promise.coroutine(function* () {
    if (_requiredSteps.length) {
      return Promise.resolve(_requiredSteps);
    }
    var packagejson = util.packagejson();
    var isoversion = machine.isoversion();
    var required = {};

    required.init = required.install || !(yield machine.exists()) || (yield machine.state()) !== 'Running' || !isoversion || util.compareVersions(isoversion, packagejson['docker-version']) < 0;

    var exists = yield machine.exists();
    if (isoversion && util.compareVersions(isoversion, packagejson['docker-version']) < 0) {
      this.steps().init.seconds = 33;
    } else if (exists && (yield machine.state()) === 'Saved') {
      this.steps().init.seconds = 8;
    } else if (exists && (yield machine.state()) !== 'Error') {
      this.steps().init.seconds = 23;
    }

    _requiredSteps = _steps.filter(function (step) {
      return required[step.name];
    });
    return Promise.resolve(_requiredSteps);
  }),
  run: Promise.coroutine(function* () {// Readd metrics.track to this step
    var steps = yield this.requiredSteps();
    for (let step of steps) {
      _currentStep = step;
      step.percent = 0;
      while (true) {
        try {
          this.emit(this.STEP_EVENT);
          yield step.run(percent => {
            if (_currentStep) {
              step.percent = percent;
              this.emit(this.PROGRESS_EVENT);
            }
          });
          metrics.track('Setup Completed Step', {
            name: step.name
          });
          step.percent = 100;
          break;
        } catch (err) {
          if (err) {
            throw err;
          } else {
            metrics.track('Setup Cancelled');
            _cancelled = true;
            this.emit(this.STEP_EVENT);
          }
          yield this.pause();
        }
      }
    }
    _currentStep = null;
    return yield machine.ip();
  }),
  setup: Promise.coroutine(function * () {
    while (true) {
      try {
        var ip = yield this.run();
        if (!ip || !ip.length) {
          throw {
            message: 'Machine IP could not be fetched. Please retry the setup. If this fails please file a ticket on our GitHub repo.',
            machine: yield machine.info(),
            ip: ip
          };
        }
        docker.addClient(NAME, ip, machine.name());
        yield docker.clients[NAME].waitForConnection();
        metrics.track('Setup Finished');
        break;
      } catch (err) {
        err.message = util.removeSensitiveData(err.message);
        metrics.track('Setup Failed', {
          step: _currentStep,
        });
        console.log(err);
        bugsnag.notify('SetupError', err.message, {
          error: err,
          output: err.message
        }, 'info');
        _error = err;
        this.emit(this.ERROR_EVENT);
        yield this.pause();
      }
    }
  })
});

module.exports = SetupStore;
