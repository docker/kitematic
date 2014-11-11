var ipc = require('ipc');

Template.update_notification.helpers({
  updateAvailable: function () {
    return Session.get('updateAvailable');
  }
});

Template.update_notification.events({
  'click .btn-update': function (e) {
    ipc.send('command', 'application:quit-install');
  }
});
