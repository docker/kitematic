var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var machine = require('../../utils/DockerMachineUtil');
var setupUtil = require('../../utils/SetupUtil');
var util = require('../../utils/Util');
var SetupStore = require('../SetupStore.js')

var _currentStep = null;
var _error = null;
var _cancelled = false;
var _retryPromise = null;
var _requiredSteps = [];

{
  name: 'check',
  title: 'Checking Digital Ocean setup',
  message: 'To run Docker containers on VirtualBox locally, Kitematic is starting a Linux virtual machine in VirtualBox. This may take a minute...',
  totalPercent: 60,
  percent: 0,
  seconds: 110,
  run: Promise.coroutine(function* (progressCallback) {
    setupUtil.simulateProgress(this.seconds, progressCallback);
    var exists = yield machine.exists();
    if (!exists || (yield machine.state()) === 'Error') {
      if (exists && (yield machine.state()) === 'Error') {
        yield machine.rm();
      }
      yield machine.create();
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
