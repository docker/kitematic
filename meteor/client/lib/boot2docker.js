var exec = require('exec');
var path = require('path');

boot2dockerexec = function (command, callback) {
  exec(path.join(getBinDir(), 'boot2docker') + ' ' + command, function(err, stdout) {
    callback(err, stdout);
  });
};

getBoot2DockerIp = function (callback) {
  boot2dockerexec('ip', function (err, stdout) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, stdout);
    }
  });
};

getBoot2DockerState = function (callback) {
  boot2dockerexec(' info', function (err, stdout) {
    if (err) {
      callback(err, null);
      return;
    }
    try {
      var info = JSON.parse(stdout);
      callback(null, info.State);
    } catch (e) {
      callback(e, null);
    }
  });
};

getBoot2DockerDiskUsage = function (callback) {
  boot2dockerexec('ssh "df"', function (err, stdout) {
    if (err) {
      callback(err, null);
      return;
    }
    try {
      var lines = stdout.split('\n');
      var dataline = _.find(lines, function (line) {
        return line.indexOf('/dev/sda1') !== -1;
      });
      var tokens = dataline.split(' ');
      tokens = tokens.filter(function (token) {
        return token !== '';
      });
      var usedGb = parseInt(tokens[2], 10) / 1000000;
      var totalGb = parseInt(tokens[3], 10) / 1000000;
      var percent = parseInt(tokens[4].replace('%', ''), 10);
      callback(null, {
        used_gb: usedGb.toFixed(2),
        total_gb: totalGb.toFixed(2),
        percent: percent
      });
    } catch (error) {
      callback(err, null);
    }
  });
};

getBoot2DockerMemoryUsage = function (callback) {
  boot2dockerexec('ssh "free -m"', function (err, stdout) {
    if (err) {
      callback(err, null);
      return;
    }
    try {
      var lines = stdout.split('\n');
      var dataline = _.find(lines, function (line) {
        return line.indexOf('-/+ buffers') !== -1;
      });
      var tokens = dataline.split(' ');
      tokens = tokens.filter(function(token) {
        return token !== '';
      });
      var usedGb = parseInt(tokens[2], 10) / 1000;
      var freeGb = parseInt(tokens[3], 10) / 1000;
      var totalGb = usedGb + freeGb;
      var percent = Math.round(usedGb / totalGb * 100);
      callback(null, {
        used_gb: usedGb.toFixed(2),
        total_gb: totalGb.toFixed(2),
        free_gb: freeGb.toFixed(2),
        percent: percent
      });
    } catch (error) {
      callback(error, null);
    }
  });
};

getBoot2DockerInfo = function (callback) {
  boot2dockerexec('ssh "sudo ifconfig eth1 192.168.59.103 netmask 255.255.255.0"', function (err, stdout) {
    exec('VBoxManage dhcpserver remove --netname HostInterfaceNetworking-vboxnet0', function (err, stdout) {
      getBoot2DockerState(function (err, state) {
      if (err) {
        callback(err, null);
        return;
      }
      if (state === 'poweroff') {
        callback(null, {state: state});
      } else {
        getBoot2DockerMemoryUsage(function (err, mem) {
          if (err) { callback(null, {state: state}); }
          getBoot2DockerDiskUsage(function (err, disk) {
            if (err) { callback(null, {state: state}); }
            callback(null, {
              state: state,
              memory: mem,
              disk: disk
            });
          });
        });
      }
    });
    });
  });
};

boot2DockerVMExists = function (callback) {
  boot2dockerexec('info', function (err) {
    if (err) {
      callback(null, false);
    } else {
      callback(null, true);
    }
  });
};

eraseBoot2DockerVMFiles = function (callback) {
  var VMFileLocation = path.join(getHomePath(), 'VirtualBox\\ VMs/boot2docker-vm');
  exec('rm -rf ' + VMFileLocation, function (err) {
    callback(err);
  });
};

initBoot2Docker = function (callback) {
  isVirtualBoxInstalled(function (err, installed) {
    if (err) {
      callback(err);
      return;
    }
    if (installed) {
      boot2dockerexec('init', function (err) {
        console.log(err);
        if (err) {
          if (err.indexOf('exit status 1') !== -1) {
            eraseBoot2DockerVMFiles(function () {
              boot2dockerexec('init', function (err) {
                callback(err);
              });
            });
          } else {
            callback(err);
          }
        } else {
          callback();
        }
      });
    } else {
      callback(new Error('initBoot2Docker called but VirtualBox isn\'t installed.'));
    }
  });
};

upgradeBoot2Docker = function (callback) {
  boot2dockerexec('upgrade', function (err, stdout) {
    console.log(stdout);
    callback(err);
  });
};

installBoot2DockerAddons = function (callback) {
  exec('/bin/cat ' + path.join(getBinDir(), 'kite-binaries.tar.gz') + ' | ' +  path.join(getBinDir(), 'boot2docker') + ' ssh "tar zx -C /usr/local/bin"', function (err, stdout) {
    console.log(stdout);
    callback(err);
  });
  exec('VBoxManage modifyvm boot2docker-vm --nic2 hostonly --nictype2 virtio --cableconnected2 on --hostonlyadapter2 vboxnet0', function (err, stdout) {});
  boot2dockerexec('ssh "sudo ifconfig eth1 192.168.59.103 netmask 255.255.255.0"', function (err, stdout) {});
  exec('VBoxManage dhcpserver remove --netname HostInterfaceNetworking-vboxnet0', function (err, stdout) {});
};

startBoot2Docker = function (callback) {
  isVirtualBoxInstalled(function (err, installed) {
    if (err) {
      callback(err);
      return;
    }
    if (installed) {
      boot2DockerVMExists(function (err, exists) {
        if (exists) {
          boot2dockerexec('up -v', function (err, stdout) {
            console.log(err);
            console.log(stdout);
            if (err) {
              if (err.indexOf('Waiting for VM to be started') !== -1 || err.indexOf('..........') !== -1) {
                installBoot2DockerAddons(function (err) {
                  callback(err);
                });
              } else {
                callback(err);
              }
            } else {
              installBoot2DockerAddons(function (err) {
                callback(err);
              });
            }
          });
        } else {
          callback(new Error('startBoot2Docker called but boot2docker-vm doesn\'t exist.'));
        }
      });
    } else {
      callback(new Error('startBoot2Docker called but VirtualBox isn\'t installed.'));
    }
  });
};

stopBoot2Docker = function (callback) {
  boot2dockerexec('stop', function (err, stdout) {
    console.log(stdout);
    console.log(err);
    if (err) {
      callback(err);
      return;
    }
    callback(null);
  });
};

checkBoot2DockerVM = function (callback) {
  boot2DockerVMExists(function (err) {
    if (err) {
      callback(err);
      return;
    } else {
      getBoot2DockerState(function (err, state) {
        if (state !== 'running') {
          callback('boot2docker not running');
        } else {
          callback();
        }
      });
    }
  });
};

// Make sure the VM exists, is up and is running.
resolveBoot2DockerVM = function (callback) {
  boot2DockerVMExists(function (err, exists) {

    // If somehow the boot2docker VM doesn't exist anymor then re-create it.
    if (!exists) {
      initBoot2Docker(function () {
        startBoot2Docker(function (err) {
          callback(err);
        });
      });
    } else {

      // If it exists but it's not running.. restart it.
      getBoot2DockerState(function (err, state) {
        if (state !== 'running') {
          startBoot2Docker(function (err) {
            callback(err);
          });
        } else {
          callback();
        }
      });
    }
  });
};
