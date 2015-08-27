import util from './Util';
import path from 'path';

module.exports = {
  resourceDir: function () {
    return process.env.RESOURCES_PATH;
  },
  macsudo: function () {
    return path.join(this.resourceDir(), 'macsudo');
  },
  terminal: function () {
    return path.join(this.resourceDir(), 'terminal');
  },
  docker: function () {
    return path.join(this.resourceDir(), 'docker' + util.binsEnding());
  },
  dockerMachine: function () {
    return path.join(this.resourceDir(), 'docker-machine' + util.binsEnding());
  },
  dockerCompose: function () {
    return path.join(this.resourceDir(), 'docker-compose' + util.binsEnding());
  }
};
