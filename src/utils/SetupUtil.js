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
import router from '../router';

let _retryPromise = null;

export default {
  simulateProgress (estimateSeconds) {
    var times = _.range(0, estimateSeconds * 1000, 200);
    var timers = [];
    _.each(times, time => {
      var timer = setTimeout(() => {
        setupActions.progress({progress: 100 * time / (estimateSeconds * 1000)});
      }, time);
      timers.push(timer);
    });
  },

  retry (removeVM) {
    if (removeVM) {
      machine.rm().finally(() => {
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
          router.get().transitionTo('setup');
          this.simulateProgress(60);
          try {
            await machine.rm();
          } catch (err) {}
          await machine.create();
        } else {
          let state = await machine.state();
          if (state !== 'Running') {
            router.get().transitionTo('setup');
            if (state === 'Saved') {
              this.simulateProgress(10);
            } else if (state === 'Stopped') {
              this.simulateProgress(25)
            }
            await machine.start();
          }
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
    console.log('Setup finished.');
    metrics.track('Setup Finished');
  }
};
