var cjson = require('cjson');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var helpers = require('./helpers');
var format = require('util').format;

exports.read = function() {
  var configJsonPath = path.resolve('Kitematic.json');
  if (fs.existsSync(configJsonPath)) {
    var configJson = cjson.load(configJsonPath);

    // Validate json or cjson.
    if (!_.isObject(configJson)) {
      configErrorLog('Your Kitematic.json doesn\t look like valid configuration.');
    }

    // Validate containers.
    _.mapObject(configJson, function(config, name) {
      if(!config.image) {
        configErrorLog(name + ': Image does not exist');
      }
      if (config.volumes) {
        _.mapObject(config.volumes, function(volume, dir) {
          //rewrite ~ with $HOME
          config.volumes.folder = rewriteHome(config.volumes.folder);
          if (config.volumes.vm_folder) {
            //rewrite ~ with $HOME
            config.volumes.vm_folder = config.volumes.vm_folder.replace('~', process.env.HOME);
          }
        });
      }

      return config;
    });

    return configJson;
  } else {
    console.error('Kitematic.json file does not exist!'.red.bold);
    helpers.printHelp();
    process.exit(1);
  }
};

function rewriteHome(location) {
  if(/^win/.test(process.platform)) {
    return location.replace('~', process.env.USERPROFILE);
  } else {
    return location.replace('~', process.env.HOME);
  }
}

function configErrorLog(message) {
  var errorMessage = 'Invalid Kitematic.json file: ' + message;
  console.error(errorMessage.red.bold);
  process.exit(1);
}

function getCanonicalPath(location) {
  var localDir = path.resolve(__dirname, location);
  if(fs.existsSync(localDir)) {
    return localDir;
  } else {
    return path.resolve(rewriteHome(location));
  }
}
