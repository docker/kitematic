var ipc = require('ipc');

Template.updateNotification.helpers({
  updateAvailable: function () {
    return Session.get('updateAvailable');
  }
});

Template.updateNotification.events({
  'click .btn-update': function (e) {
    ipc.send('command', 'application:quit-install');
  }
});
