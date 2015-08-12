import util from './Util';
import path from 'path';
import fs from 'fs';

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
    let composePath = path.join(this.resourceDir(), 'docker-compose' + util.binsEnding());
    fs.access(composePath, fs.F_OK, (err) => {
      if (err) {
        throw err;
      }
      return composePath;
    });
  }
};
