var nodemiral = require('nodemiral');
var path = require('path');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var shell = require("shelljs");
require('colors');

module.exports = Actions;

function Actions(config, cwd) {
  this.cwd = cwd;
  this.config = config;
  this.sessionsMap = this._createSessionsMap(config);
}

Actions.prototype._createSessionsMap = function(config) {
  var sessionsMap = {};
  var machineName = 'docker-vm';
  if (process.env.DOCKERMACHINE) {
    machineName = process.env.DOCKERMACHINE;
  }

  var machineInfo = shell.exec("docker-machine inspect " + machineName, {silent: true}).output;
  if (machineInfo) {
    machineInfo = JSON.parse(machineInfo);
    var host = machineInfo.Driver.IPAddress;
    var auth = { username: machineInfo.Driver.SSHUser };
    auth.pem = fs.readFileSync(path.resolve(machineInfo.StorePath) + '/id_rsa', 'utf8');

    var nodemiralOptions = {
      keepAlive: true
    };

    if(!sessionsMap['linux']) {
      sessionsMap['linux'] = {
        sessions: [],
        taskListsBuilder:require('./taskLists')('linux')
      };
    }

    var session = nodemiral.session(host, auth, nodemiralOptions);
    session._serverConfig = machineInfo;
    sessionsMap['linux'].sessions.push(session);
  }

  return sessionsMap;
};

Actions.prototype._executePararell = function(actionName, args) {
  var self = this;
  var sessionInfoList = _.values(self.sessionsMap);
  async.map(
    sessionInfoList,
    function(sessionsInfo, callback) {
      var taskList = sessionsInfo.taskListsBuilder[actionName]
        .apply(sessionsInfo.taskListsBuilder, args);
      taskList.run(sessionsInfo.sessions, function(summaryMap) {
        callback(null, summaryMap);
      });
    },
    whenAfterCompleted
  );
};

Actions.prototype.run = function() {
  this._executePararell("run", [this.config]);
};

Actions.prototype.stop = function() {
  this._executePararell("stop", [this.config]);
};

Actions.prototype.remove = function() {
  this._executePararell("remove", [this.config]);
};

Actions.prototype.restart = function() {
  this._executePararell("restart", [this.config]);
};

function storeLastNChars(vars, field, limit, color) {
  return function(data) {
    vars[field] += data.toString();
    if(vars[field].length > 1000) {
      vars[field] = vars[field].substring(vars[field].length - 1000);
    }
  };
}

function whenAfterDeployed(buildLocation) {
  return function(error, summaryMaps) {
    rimraf.sync(buildLocation);
    whenAfterCompleted(error, summaryMaps);
  };
}

function whenAfterCompleted(error, summaryMaps) {
  var errorCode = error || haveSummaryMapsErrors(summaryMaps) ? 1 : 0;
  process.exit(errorCode);
}

function haveSummaryMapsErrors(summaryMaps) {
  return _.some(summaryMaps, hasSummaryMapErrors);
}

function hasSummaryMapErrors(summaryMap) {
  return _.some(summaryMap, function (summary) {
    return summary.error;
  });
}
