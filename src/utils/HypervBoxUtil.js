import fs from 'fs';
import path from 'path';
import util from './Util';
import Promise from 'bluebird';
import machine from './DockerMachineUtil';

var HypervBox = {
  command: function() {
    return 'powershell.exe';
  },
  // TODO: ..We'll probably need a differnt command here in the future. That's why code dupe.
  commandElevated: function () {
    return 'powershell.exe';
  },
  installed: function () {
    return util.execFile([this.command(), '@(Get-Command get-vm).ModuleName']).then(stdout => {
      console.log('stdout: ', stdout);
      // There comes an CR LF at the end of the string, that's why we use indexOf
      if ( stdout.toUpperCase().indexOf('HYPER-V') !== -1) {
        return Promise.resolve(true);
      }
    }).catch(() => {
      return Promise.resolve(null);
    });
  },
  // TODO  what does this do
  /*
  active: function () {
    return fs.existsSync('/dev/vboxnetctl');
  },
  */

  hasAdminRights: function() {
    return util.execFile([this.command(), 'Get-VMHostSupportedVersion']).then(stdout => {
      console.log('stdout: ', stdout);
      // To execute the above command you'll need Admin or Hyper-V-Admin rights.
      if ( stdout.toUpperCase().indexOf('TRUE') !== -1) {
        return Promise.resolve(true);
      }
    }).catch(() => {
      return Promise.resolve(false);
    });
  },
  switchName: function (name) {
//    return util.execFile([this.command(), '$(Get-VMSwitch | where {$_.SwitchType -eq "external"}).name']).then(out => {
    return util.execFile([this.command(), '$(Get-VMSwitch).name']).then(out => {
      // We use the same mechanism as docker-machine. Use the first switch we find.
      return (out.replace('\r','').split('\n')[0]);
    }).catch(() => {
      return false;
    });
  },
  version: function () {
    // there seems to be a problem with elevated execution. see: https://github.com/nodejs/node-v0.x-archive/issues/6797
    // The only easy possibility seems to be to communicat with a file.

      return util.execFile([this.command(), 'Get-VMHostSupportedVersion']).then(stdout => {

        let match = stdout.match(/^(.*) True/im);
        if (match != null) {
            // matched text: match[0]
            // match start: match.index
            // capturing group n: match[n]
            return Promise.resolve(match[1]);
        }
        Promise.reject('No VM version information found');
      }).catch(() => {
        return Promise.resolve(null);
      });
  },
  // TODO: hyper-v doesn't offer this possibility, out of the box. We'll need samba in the guest vm.
  // https://hub.docker.com/r/svendowideit/samba/ would be an option
  mountSharedDir: function (vmName, pathName, hostPath) {
    return util.execFile([this.command(), 'sharedfolder', 'add', vmName, '--name', pathName, '--hostpath', hostPath, '--automount']);
  },
  // Needed for consistency check
  vmExists: function (name) {
    return util.execFile([this.command(), "Get-VM | Where {$_.Name -eq '" + name + "'}"]).then(out => {
      console.log(out)
      return (out.indexOf(name) !== -1);
    }).catch(() => {
      return false;
    });
  }
};

module.exports = HypervBox;
