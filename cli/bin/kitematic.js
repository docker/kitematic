#! /usr/bin/env node

var path = require('path');
var cjson = require('cjson');
var Config = require('../lib/config');
var ActionsRegistry = require('../lib/actions');
var helpers = require('../lib/helpers');
require('colors');

console.log('\nKitematic: The easiest way to start using Docker on Mac & Windows'.bold.blue);
console.log('-----------------------------------------------------------------\n'.bold.blue);

var action = process.argv[2];
if(action == 'init') {
  //special setup for init
  ActionsRegistry.init();
} else {
  var cwd = path.resolve('.');
  //read config and validate it
  var config = Config.read();
  runActions(config, cwd);
}

function runActions(config, cwd) {
  var actionsRegistry = new ActionsRegistry(config, cwd);
  if(actionsRegistry[action]) {
    actionsRegistry[action]();
  } else {
    if(typeof action !== "undefined") {
      var errorMessage = 'No Such Action Exists: ' + action;
      console.error(errorMessage.bold.red);
    }
    helpers.printHelp();
  }
}
