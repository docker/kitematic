var nodemiral = require('nodemiral');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var ejs = require('ejs');
var shell = require("shelljs");

var SCRIPT_DIR = path.resolve(__dirname, '../../scripts/linux');

exports.run = function(config) {
  var taskList = nodemiral.taskList('Run (Linux)', {series: true});

  _.mapObject(config, function(container, name) {

    // Setup volume shares.
    _.mapObject(container.volumes, function(config, volume) {
      // console.log(virtualBox);


      // VBoxManage sharedfolder add
    });

    if (process.env.DEBUG) {
      debugScriptTemplate('run.sh', {
        name: name,
        config: container
      });
    }

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

function debugScriptTemplate(script, vars) {
  fs.readFile(path.resolve(SCRIPT_DIR, script), {encoding: 'utf8'}, function(err, content) {
    if(err) {
      callback(err);
    } else {
      if(vars) {
        var content = ejs.compile(content)(vars);
        console.log(content);
      }
    }
  });
}
