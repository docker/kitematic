var fs = require('fs');
var exec = require('exec');
var path = require('path');

isVirtualBoxInstalled = function (callback) {
  fs.exists('/usr/bin/VBoxManage', function (exists) {
    callback(null, exists);
  });
};

isResolverSetup = function (callback) {
  fs.readFile('/etc/resolver/dev', {
    encoding: 'utf8'
  }, function (err, data) {
    if (err) {
      callback(err, false);
    } else {
      if (data.indexOf('nameserver 172.17.42.1') !== -1) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  });
};

setupVirtualBoxAndResolver = function (skipVirtualBox, callback) {
  var installFile = path.join(getBinDir(), 'install');
  var cocoaSudo = path.join(getBinDir(), 'cocoasudo');
  var execCommand = cocoaSudo + ' --prompt="Kitematic Setup wants to make changes. Type your password to allow this." ' + installFile;
  console.log(execCommand);
  var env = {
    VIRTUALBOX_PKG_PATH: path.join(getBinDir(), 'virtualbox-4.3.12.pkg')
  };
  if (!skipVirtualBox) {
    env.INSTALL_VIRTUALBOX = true;
  }
  exec(execCommand, {env: env}, function (err, stdout) {
    console.log(stdout);
    if (err) {
      console.log(err);
      callback(err);
      return;
    }
    console.log('Virtualbox Installation & Resolver config complete.');
    callback();
  });
};

