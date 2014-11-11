var ipc = require('ipc');

// Listen for auto updates
ipc.on('notify', function (message) {
  if (message === 'window:update-available') {
    Session.set('updateAvailable', true);
  }
});