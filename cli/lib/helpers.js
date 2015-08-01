var exec = require('child_process').exec;

exports.printHelp = function() {
  console.error('\nValid Actions');
  console.error('-------------');
  console.error('list           - Lists the status of container(s) managed in the docker-compose.yml');
  console.error('run          - Starts the container(s) with it\'s setup from the docker-compose.yml');
  console.error('stop        - Stops the container(s) defined in the docker-compose.yml');
  console.error('remove        - Removes the container(s) defined in the docker-compose.yml');
  console.error('restart        - Restart the container(s) defined in the docker-compose.yml');
  console.error('init        - Create an example docker-compose.yml');
};
