import _ from 'underscore';
import fs from 'fs';
import path from 'path';
import Promise from 'bluebird';
import util from './Util';
import bugsnag from 'bugsnag-js';
import virtualBox from './VirtualBoxUtil';
import setupServerActions from '../actions/SetupServerActions';
import metrics from './MetricsUtil';
import machine from './DockerMachineUtil';
import docker from './DockerUtil';
import router from '../router';

let _retryPromise = null;
let _timers = [];

export default {
  simulateProgress (estimateSeconds) {
    var times = _.range(0, estimateSeconds * 1000, 200);
    _.each(times, time => {
      var timer = setTimeout(() => {
        setupServerActions.progress({progress: 100 * time / (estimateSeconds * 1000)});
      }, time);
      _timers.push(timer);
    });
  },

  clearTimers () {
    _timers.forEach(t => clearTimeout(t));
    _timers = [];
  },

  retry (removeVM) {
    router.get().transitionTo('loading');
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
            if (state === 'Saved') {
              router.get().transitionTo('setup');
              this.simulateProgress(10);
            } else if (state === 'Stopped') {
              router.get().transitionTo('setup');
              this.simulateProgress(25)
            }
            await machine.start();
          }
        }

        // Try to receive an ip address from machine, for at least to 80 seconds.
        let tries = 80, ip = null;
        while (!ip && tries > 0) {
          try {
            console.log('Trying to fetch machine IP, tries left: ' + tries);
            ip = await machine.ip();
            tries -= 1;
            await Promise.delay(1000);
          } catch (err) {}
        }

        if (ip) {
          docker.setup(ip, machine.name());
        } else {
          throw new Error('Could not determine IP from docker-machine.');
        }

        break;
      } catch (error) {
        router.get().transitionTo('setup');
        metrics.track('Setup Failed');
        setupServerActions.error({error});
        bugsnag.notify('SetupError', error.message, {
          error: error,
          output: error.message
        }, 'info');
        this.clearTimers();
        await this.pause();
      }
    }
    metrics.track('Setup Finished');
  }
};
