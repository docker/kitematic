import util from './Util';
import resources from './ResourcesUtil';
import machine from './DockerMachineUtil';

var DockerCompose = {
  command: function () {
    return resources.dockerCompose();
  },
  name: function () {
    return 'docker-compose.yml';
  },
  up: function (fileName = this.name(), vmEnv = {}) {
    return util.exec([this.command(), '--file', fileName, 'up', '-d'], vmEnv);
  },
  start: function (fileName = this.name(), vmEnv = {}) {
    return util.exec([this.command(), 'start', '--file', fileName], vmEnv);
  },
  stop: function (fileName = this.name(), vmEnv = {}) {
    return util.exec([this.command(), 'stop', '--file', fileName], vmEnv);
  },
  rm: function (fileName = this.name(), vmEnv = {}) {
    return util.exec([this.command(), 'rm', '--file', fileName], vmEnv);
  }
};

module.exports = DockerCompose;
