var cjson = require('cjson');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
YAML = require('yamljs');
var helpers = require('./helpers');
var format = require('util').format;

exports.read = function() {
  var configJson;
  var configJSONPath = path.resolve('Kitematic.json');
  var configYAMLPath = path.resolve('Kitematic.yaml');
  if (fs.existsSync(configJSONPath)) {
    configJson = cjson.load(configJSONPath);
  }
  else if (fs.existsSync(configYAMLPath)) {
    configJson = YAML.load(configYAMLPath);
  }
  else {
    console.error('A Kitematic.json or Kitematic.yaml file does not exist!'.red.bold);
    helpers.printHelp();
    process.exit(1);
  }

  // Validate configuration.
  if (!_.isObject(configJson)) {
    configErrorLog('Check your Kitematicfile, its not valid configuration.');
    helpers.printHelp();
    process.exit(1);
  }
  else {
    // Validate containers.
    _.mapObject(configJson, function(config, name) {
      if(!config.image) {
        configErrorLog(name + ': Missing required "image" parameter');
        helpers.printHelp();
        process.exit(1);
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
