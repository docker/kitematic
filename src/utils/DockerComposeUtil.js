import util from './Util';
import resources from './ResourcesUtil';

var DockerCompose = {
  command: function () {
    return resources.dockerCompose();
  },
  name: function () {
    return 'docker-compose.yml';
  },
  up: function (fileName = this.name()) {
    return util.exec([this.command(), '--file', fileName, 'up', '-d']);;
  },
  start: function (fileName = this.name()) {
    return util.exec([this.command(), '--file', fileName, 'start']);
  },
  stop: function (fileName = this.name()) {
    return util.exec([this.command(), '--file', fileName, 'stop']);
  },
  rm: function (fileName = this.name()) {
    return util.exec([this.command(), '--file', fileName, 'rm']);
  }
};

module.exports = DockerCompose;
