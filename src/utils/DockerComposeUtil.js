import _ from 'underscore';
import path from 'path';
import Promise from 'bluebird';
import fs from 'fs';
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
    console.log('Processing file: %o', fileName);
    return new Promise((resolve, reject) => {
      console.log('Getting stats');
      fs.stat(fileName, (err, stats) => {
        if (err) {
          console.log('File Error: %o', err);
          throw err;
        }
        console.info('Stats are: %o', stats);

        if (stats.isDirectory()) {
          fs.readdir(fileName, (error, files) => {
            if (error) {
              console.log('Err: %o', error);
              throw error;
            }
            if (_.indexOf(files, this.name()) !== -1) {
              console.log('Composing %o', fileName + this.name());
              // resolve(util.exec([this.command(), '--file', fileName + this.name(), 'up', '-d']));
              resolve(true);
            } else {
              console.log('Rejected for directory');
              reject(new Error('docker-compose.yml not found in directory: ' + fileName));
            }
          });
        } else if (stats.isFile()) {
          console.log('Composing %o', fileName);
          // resolve(util.exec([this.command(), '--file', fileName, 'up', '-d']));
          resolve(true);
        }
      });
    });
  },
  start: function (fileName = this.name()) {
    return util.exec([this.command(), 'start', '--file', fileName]);
  },
  stop: function (fileName = this.name()) {
    return util.exec([this.command(), 'stop', '--file', fileName]);
  },
  rm: function (fileName = this.name()) {
    return util.exec([this.command(), 'rm', '--file', fileName]);
  }
};

module.exports = DockerCompose;
