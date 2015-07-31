var exec = require('child_process').exec;

exports.printHelp = function() {
  console.error('\nValid Actions');
  console.error('-------------');
  console.error('run           - Run containers defined in your Kitematicfile');
  console.error('stop          - Stop containers defined in your Kitematicfile');
  console.error('remove        - Run containers defined in your Kitematicfile');
};
