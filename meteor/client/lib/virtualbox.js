var fs = require('fs');
var child_process = require('child_process');
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

setupResolver = function (callback) {
  var installFile = path.join(Util.getBinDir(), 'install');
  var cocoaSudo = path.join(Util.getBinDir(), 'cocoasudo');
  var execCommand = cocoaSudo + ' --prompt="Kitematic Setup wants to make changes. Type your password to allow this." ' + installFile;
  child_process.exec(execCommand, function (error, stdout, stderr) {
    console.log(stdout);
    if (error) {
      console.log(error);
      callback(error);
      return;
    }
    console.log('Virtualbox Installation & Resolver config complete.');
    callback();
  });
};

setupVirtualBox = function (callback) {
  child_process.exec('open -W ' + path.join(Util.getBinDir(), 'virtualbox-4.3.12.pkg'), function (error, stdout, stderr) {
    console.log(stdout);
    if (error) {
      console.log(error);
      callback(error);
      return;
    }
    console.log('Virtualbox Installation running.');
    callback();
  });
};
