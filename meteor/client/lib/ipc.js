var ipc = require('ipc');

// Listen for auto updates
ipc.on('notify', function (message) {
  if (message === 'window:update-available') {
    Session.set('updateAvailable', true);
  }
  if (message === 'application:quit') {
    VirtualBox.saveVMState('boot2docker-vm', function (err) {
      if (err) {
        console.log(err);
      }
    });
  }
});