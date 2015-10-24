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
    this.clearTimers();
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
        let ip = null;

        if (!util.isLinux()) {
          setupServerActions.started({started: false});
          if (!virtualBox.installed()) {
            router.get().transitionTo('setup');
            throw new Error('VirtualBox is not installed. Please install it via the Docker Toolbox.');
          }

          if (!machine.installed()) {
            router.get().transitionTo('setup');
            throw new Error('Docker Machine is not installed. Please install it via the Docker Toolbox.');
          }

          setupServerActions.started({started: true});
          let exists = await virtualBox.vmExists(machine.name()) && fs.existsSync(path.join(util.home(), '.docker', 'machine', 'machines', machine.name()));
          if (!exists) {
            router.get().transitionTo('setup');
            setupServerActions.started({started: true});
            this.simulateProgress(60);
            try {
              await machine.rm();
            } catch (err) {}
            await machine.create();
          } else {
            let state = await machine.status();
            if (state !== 'Running') {
              if (state === 'Saved') {
                router.get().transitionTo('setup');
                this.simulateProgress(10);
              } else if (state === 'Stopped') {
                router.get().transitionTo('setup');
                this.simulateProgress(25);
              }
              await machine.start();
            }
          }

          // Try to receive an ip address from machine, for at least to 80 seconds.
          let tries = 80;
          while (!ip && tries > 0) {
            try {
              console.log('Trying to fetch machine IP, tries left: ' + tries);
              ip = await machine.ip();
              tries -= 1;
              await Promise.delay(1000);
            } catch (err) {}
          }
        } else {
          ip = 'localhost';
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
