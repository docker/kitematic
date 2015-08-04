var cjson = require('cjson');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
YAML = require('yamljs');
var helpers = require('./helpers');
var format = require('util').format;

exports.read = function() {
  var configJson;
  var configYAMLPath = path.resolve('docker-compose.yml');
  if (fs.existsSync(configYAMLPath)) {
    configJson = YAML.load(configYAMLPath);
  }
  else {
    console.error('A docker-compose.yml file does not exist!'.red.bold);
    helpers.printHelp();
    process.exit(1);
  }

  // Validate configuration.
  if (!_.isObject(configJson)) {
    configErrorLog('Check your docker-compose.yml, its not valid configuration.');
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
      var volumes = {};
      if (config.volumes) {
        for(dir in config.volumes) {
          volume = _.clone(config.volumes[dir]);
          //rewrite ~ with $HOME
          var parts = (/^\d+$/.test(dir) ? volume : dir).split(/:(.+)?/);
          var localDir = "";
          if (parts[0]) {
            localDir = path.resolve(rewriteHome(parts[0]));
          }
          if (parts[1]) {
            dir = localDir + (parts[1] ? ":" + parts[1] : "");
          }
          else {
            dir = volume;
          }
          if (config.volumes.vm_folder) {
            //rewrite ~ with $HOME
            volume.vm_folder = volume.vm_folder.replace('~', process.env.HOME);
          }
          volumes[dir] = volume;
        }
      }
      config.volumes = volumes;

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
  var errorMessage = 'Invalid docker-compose.yml file: ' + message;
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
