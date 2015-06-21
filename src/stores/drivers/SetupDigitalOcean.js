var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var machine = require('../../utils/DockerMachineUtil');
var setupUtil = require('../../utils/SetupUtil');
var util = require('../../utils/Util');
var SetupStore = require('../SetupStore.js');
var Client = require('node-rest-client').Client;

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
  run: Promise.coroutine(function (progressCallback) {
    client = new Client();
    let digitaloceantoken = localStorage.getItem('digitalocean.token');
    args = {
      parameters:{token:digitaloceantoken}
      headers:{"Content-Type":"application/json","Authorization":"Bearer"}// fix here
    }
    client.get("https://api.digitalocean.com/v2/account", args,
      function(data, response){
          var response = console.log(response);
      )}
    if (!response === "200")
      return;
  }
}];
