import _ from 'underscore';
import fs from 'fs';
import path from 'path';
import Promise from 'bluebird';
import util from './Util';
import bugsnag from 'bugsnag-js';
import virtualBox from './VirtualBoxUtil';
import setupActions from '../actions/SetupActions';
import metrics from './MetricsUtil';
import machine from './DockerMachineUtil';
import docker from './DockerUtil';

let _retryPromise = null;

export default {
  simulateProgress (estimateSeconds, progress) {
    var times = _.range(0, estimateSeconds * 1000, 200);
    var timers = [];
    _.each(times, time => {
      var timer = setTimeout(() => {
        setupActions.progress(100 * time / (estimateSeconds * 1000));
      }, time);
      timers.push(timer);
    });
  },

  retry (removeVM) {
    if (removeVM) {
      machine.rm().finally(() => {
        console.log('machine removed');
        _retryPromise.resolve();
      });
    } else {
      _retryPromise.resolve();
    }
  },

  pause () {
    _retryPromise = Promise.defer();
    return _retryPromise.promise;
  },

  async setup () {
    metrics.track('Started Setup');
    while (true) {
      try {
        if (!util.isWindows() && !virtualBox.active()) {
          await util.exec(setupUtil.macSudoCmd(util.escapePath('/Library/Application Support/VirtualBox/LaunchDaemons/VirtualBoxStartup.sh') + ' restart'));
        }

        let exists = await virtualBox.vmExists('default');
        if (!exists) {
          this.simulateProgress(60, progress => setupActions.progress(progress));
          await machine.rm();
          await machine.create();
        } else {
          let state = await machine.state();
          if (state === 'Saved') {
            this.simulateProgress(10, progress => setupActions.progress(progress));
          } else {
            this.simulateProgress(25, progress => setupActions.progress(progress));
          }
          await machine.start();
        }

        let ip = await machine.ip();
        docker.setup(ip, machine.name());
        await docker.waitForConnection();
        break;
      } catch (err) {
        setupActions.error(err);
        bugsnag.notify('SetupError', err.message, {
          error: err,
          output: err.message
        }, 'info');
        await this.pause();
      }
    }
    metrics.track('Setup Finished');
  }
};
