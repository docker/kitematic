import _ from 'underscore';
import fs from 'fs';
import path from 'path';
import Promise from 'bluebird';
import bugsnag from 'bugsnag-js';
import util from './Util';
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
    metrics.track('Retried Setup', {
      removeVM
    });

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

  setup() {
    return util.isLinux() ? this.nativeSetup() : this.nonNativeSetup();
  },

  async nativeSetup () {
    while (true) {
      try {
        docker.setup('localhost', machine.name());
        docker.isDockerRunning();

        break;
      } catch (error) {
        router.get().transitionTo('setup');
        metrics.track('Native Setup Failed');
        setupServerActions.error({error});

        let message = error.message.split('\n');
        let lastLine = message.length > 1 ? message[message.length - 2] : 'Docker Machine encountered an error.';
        bugsnag.notify('Native Setup Failed', lastLine, {
          'Docker Machine Logs': error.message
        }, 'info');

        this.clearTimers();
        await this.pause();
      }
    }
  },

  async nonNativeSetup () {
    let virtualBoxVersion = null;
    let machineVersion = null;
    while (true) {
      try {
        setupServerActions.started({started: false});

        // Make sure virtulBox and docker-machine are installed
        let virtualBoxInstalled = virtualBox.installed();
        let machineInstalled = machine.installed();
        if (!virtualBoxInstalled || !machineInstalled) {
          router.get().transitionTo('setup');
          if (!virtualBoxInstalled) {
            setupServerActions.error({error: 'VirtualBox is not installed. Please install it via the Docker Toolbox.'});
          } else {
            setupServerActions.error({error: 'Docker Machine is not installed. Please install it via the Docker Toolbox.'});
          }
          this.clearTimers();
          await this.pause();
          continue;
        }

        virtualBoxVersion = await virtualBox.version();
        machineVersion = await machine.version();

        setupServerActions.started({started: true});
        metrics.track('Started Setup', {
          virtualBoxVersion,
          machineVersion
        });

        virtualBox.getShareDir(machine.name());
        
        
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
        let tries = 80, ip = null;
        while (!ip && tries > 0) {
          try {
            tries -= 1;
            console.log('Trying to fetch machine IP, tries left: ' + tries);
            ip = await machine.ip();
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

        let novtx = error.message.indexOf('This computer doesn\'t have VT-X/AMD-v enabled') !== -1;
        metrics.track(novtx ? 'Setup Halted' : 'Setup Failed', {
          virtualBoxVersion,
          machineVersion
        });

        let message = error.message.split('\n');
        let lastLine = message.length > 1 ? message[message.length - 2] : 'Docker Machine encountered an error.';
        let virtualBoxLogs = machine.virtualBoxLogs();
        bugsnag.notify('Setup Failed', lastLine, {
          'Docker Machine Logs': error.message,
          'VirtualBox Logs': virtualBoxLogs,
          'VirtualBox Version': virtualBoxVersion,
          'Machine Version': machineVersion,
          groupingHash: machineVersion
        }, 'info');

        setupServerActions.error({error: new Error(message)});

        this.clearTimers();
        await this.pause();
      }
    }
    metrics.track('Setup Finished', {
      virtualBoxVersion,
      machineVersion
    });
  }
};
