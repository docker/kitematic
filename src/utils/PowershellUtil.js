import util from './Util';

var PowershellUtil  = 
{
  runCommandWithArgs : function (args) {
    console.log("cmd: ", args);
    return util.execFile([this.commandElevated(), 'start-process', 'powershell', '-verb', 'runas', '-wait', '-argumentList', args]).then(stdout => {
        return Promise.resolve(null);
    }).catch((error) => {
        throw new Error(error.message);
    });
  },
  commandElevated: function commandElevated() {
    return 'powershell.exe';
  },
};

module.exports = PowershellUtil;