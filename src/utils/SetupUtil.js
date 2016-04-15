import _ from 'underscore';
import fs from 'fs';
import path from 'path';
import Promise from 'bluebird';
import bugsnag from 'bugsnag-js';
import util from './Util';
import virtualBox from './VirtualBoxUtil';
import hypervBox from './HypervBoxUtil';
import setupServerActions from '../actions/SetupServerActions';
import metrics from './MetricsUtil';
import machine from './DockerMachineUtil';
import docker from './DockerUtil';
import router from '../router';

// Docker Machine exits with 3 to differentiate pre-create check failures (e.g.
// virtualization isn't enabled) from normal errors during create (exit code
// 1).
const precreateCheckExitCode = 3;

let _retryPromise = null;
let _timers = [];
let useNative = util.isNative() ? util.isNative() : true;

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

  async useVbox () {
    metrics.track('Retried Setup with VBox');
    localStorage.setItem('settings.useNative', false);
    router.get().transitionTo('loading');
    setupServerActions.error({ error: { message: null }});
    _retryPromise.resolve();
  },

  retry (removeVM) {
    metrics.track('Retried Setup', {
      removeVM
    });

    router.get().transitionTo('loading');
    setupServerActions.error({ error: { message: null }});
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

  // main setup loop
  async setup () {
    while (true) {
      try {
        if (util.isNative()) {
          localStorage.setItem('setting.useNative', true);
          let stats = fs.statSync('/var/run/docker.sock');
          if (stats.isSocket()) {
            await this.nativeSetup();
          } else {
            throw new Error('File found is not a socket');
          }
        } else {
          await this.nonNativeSetup();
        }
        return;
      } catch (error) {
        metrics.track('Native Setup Failed');
        setupServerActions.error({error});

        bugsnag.notify('Native Setup Failed', error.message, {
          'Docker Error': error.message
        }, 'info');
        this.clearTimers();
        await this.pause();
      }
    }
  },

  async nativeSetup () {
    while (true) {
      try {
        router.get().transitionTo('setup');
        docker.setup(util.isLinux() ? 'localhost':'docker.local');
        setupServerActions.started({started: true});
        this.simulateProgress(20);
        return docker.version();
      } catch (error) {
        throw new Error(error);
      }
    }
  },

  async nonNativeSetup () {
    let hypervBoxVersion = null;
    let virtualBoxVersion = null;
    let machineVersion = null;
    let provider = "virtualbox";   //default
    let hypervSwitchName = null;
   
    while (true) {
      try {
        setupServerActions.started({started: false});

        // Make sure virtualBox or docker-machine are installed
        let virtualBoxInstalled = virtualBox.installed();
        let machineInstalled = machine.installed();

        let hypervInstalled = await hypervBox.installed();
        
        if (!machineInstalled) {
          router.get().transitionTo('setup');

          setupServerActions.error({error: 'Docker Machine is not installed. Please install it via the Docker Toolbox.'});

          this.clearTimers();
          await this.pause();
          continue;
        }
        
        if (hypervInstalled) {
          //TODO: make UI for this setting!
          localStorage.setItem('setting.useHyperv', true);
          provider = 'hyperv';

          // To read hyperv versions, you need to be in group: Hyper-V-Administrators
          let userHasHypervAdminRights = await hypervBox.hasAdminRights();
          router.get().transitionTo('setup');

          if (!userHasHypervAdminRights) {
            setupServerActions.error({error: {message: 'Hyper-V is installed, but user isn\'t member of "Hyper-V Administrators".  Check out the HowTo!', sendUserTo: 'hyperv-faq'}});
            this.clearTimers();
            await this.pause();
            continue;
          }

          hypervSwitchName = await hypervBox.switchName();

          if (!hypervSwitchName) {
            setupServerActions.error({error: {message: 'It seems, there is no "external" vSwitch available. Check out the HowTo!', sendUserTo: 'hyperv-faq'}});
            this.clearTimers();
            await this.pause();
            continue;
          } else {
            localStorage.setItem('virtualSwitch', hypervSwitchName);
          }

        }

        // Existing behaviour
        if (!virtualBoxInstalled && !hypervInstalled) {
          router.get().transitionTo('setup');
          setupServerActions.error({error: 'Neither VirtualBox, nor Hyper-V is installed. Please install one of them! Help can be found at Docker Toolbox page.'});
          this.clearTimers();
          await this.pause();
          continue;
        }

        (hypervInstalled) ? hypervBoxVersion = await hypervBox.version(machine.name()) : 'N/A';
        (virtualBoxInstalled) ? virtualBoxVersion = await virtualBox.version() : 'N/A';
        machineVersion = await machine.version();

        setupServerActions.started({started: true});
        metrics.track('Started Setup', {
          virtualBoxVersion,
          machineVersion,
          hypervBoxVersion
        });
        
        // TODO: can be improved when more drivers are supported.
        // Consistency checks. Sometimes users remove vms with the native GUI, but docker machine still knows it.
        let existsInVmGui = false;
        switch (provider){
          case "virtualbox":{
            existsInVmGui = await virtualBox.vmExists(machine.name())
          }
          case "hyperv": {
            existsInVmGui = await hypervBox.vmExists(machine.name())
          }
        }

        let vmExists = existsInVmGui && fs.existsSync(path.join(util.home(), '.docker', 'machine', 'machines', machine.name()));
        if (!vmExists) {
          router.get().transitionTo('setup');
          setupServerActions.started({started: true});
          this.simulateProgress(80); // with hyperv it seems to need more than 60
          try {
            await machine.rm(machine.name());
          } catch (err) {}
/*
*
* Make Kitematic give more feedback. .. If Hyper-V is used tell them, we need to elevate the setup process.
* due to some issues with docker-machine and MS hyper-v. resize vhd file access issues.
*
*
*
*
*
*/
          await machine.create(machine.name(), provider, virtualBoxInstalled);
        } else {
          let state = await machine.status();
          if (state !== 'Running') {
            router.get().transitionTo('setup');
            setupServerActions.started({started: true});
            if (state === 'Saved') {
              this.simulateProgress(10);
            } else if (state === 'Stopped') {
              this.simulateProgress(25);
            } else {
              this.simulateProgress(40);
            }
            await machine.start();
          }
        }

        // Try to receive an ip address from machine, for at least to 80 seconds.
        // TODO: user feedback !!!
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
          await docker.version();
        } else {
          throw new Error('Could not determine IP from docker-machine.');
        }

        break;
      } catch (error) {
        router.get().transitionTo('setup');

        if (error.code === precreateCheckExitCode) {
          metrics.track('Setup Halted', {
            virtualBoxVersion,
            machineVersion,
            hypervBoxVersion
          });
        } else {
          metrics.track('Setup Failed', {
            virtualBoxVersion,
            machineVersion,
            hypervBoxVersion
          });
        }

        let message = error.message.split('\n');
        let lastLine = message.length > 1 ? message[message.length - 2] : 'Docker Machine encountered an error.';
        let virtualBoxLogs = (provider === 'virtualbox') ? machine.virtualBoxLogs() || 'N/A' : 'N/A';
        bugsnag.notify('Setup Failed', lastLine, {
          'Docker Machine Logs': error.message,
          'VirtualBox Logs': virtualBoxLogs,
          'VirtualBox Version': virtualBoxVersion,
          'Machine Version': machineVersion,
          'Hyper-V Version': hypervBoxVersion,
          groupingHash: machineVersion
        }, 'info');

        setupServerActions.error({error: new Error(message)});

        this.clearTimers();
        await this.pause();
      }
    }
    metrics.track('Setup Finished', {
      virtualBoxVersion,
      hypervBoxVersion,
      machineVersion
    });
  }
};
