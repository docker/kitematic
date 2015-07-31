var nodemiral = require('nodemiral');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

var SCRIPT_DIR = path.resolve(__dirname, '../../scripts/linux');

exports.run = function(config) {
  var taskList = nodemiral.taskList('Run (Linux)');

  _.mapObject(config, function(container, name) {
    taskList.executeScript('Starting ' + name, {
      script: path.resolve(SCRIPT_DIR, 'run.sh'),
      vars: {
        name: name,
        config: container
      }
    });
  });

  return taskList;
};

exports.stop = function(config) {
  var taskList = nodemiral.taskList('Stop (Linux)');

  _.mapObject(config, function(container, name) {
    taskList.executeScript('Stopping ' + name, {
      script: path.resolve(SCRIPT_DIR, 'stop.sh'),
      vars: {
        name: name
      }
    });
  });

  return taskList;
};

exports.remove = function(config) {
  var taskList = nodemiral.taskList('Remove (Linux)');

  _.mapObject(config, function(container, name) {
    taskList.executeScript('Removing ' + name, {
      script: path.resolve(SCRIPT_DIR, 'remove.sh'),
      vars: {
        name: name
      }
    });
  });

  return taskList;
};

exports.restart = function(config) {
  var taskList = nodemiral.taskList('Restart (Linux)');

  _.mapObject(config, function(container, name) {
    taskList.executeScript('Restarting ' + name, {
      script: path.resolve(SCRIPT_DIR, 'run.sh'),
      vars: {
        name: name,
        config: container
      }
    });
  });

  return taskList;
};
