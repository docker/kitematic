var util = require('./Util');
var path = require('path');

module.exports = {
    resourceDir() {
        return process.env.RESOURCES_PATH;
    },
    macsudo() {
        return path.join(this.resourceDir(), 'macsudo');
    },
    terminal() {
        return path.join(this.resourceDir(), 'terminal');
    },
    docker() {
        return path.join(this.resourceDir(), 'docker-' + util.packagejson()['docker-version'] + util.binsEnding());
    },
    docker_machine() {
        return path.join(this.resourceDir(), 'docker-machine-' + util.packagejson()['docker-machine-version'] + util.binsEnding());
    }
};