Template.setup_layout.rendered = function () {
  Meteor.setInterval(function () {
    $('.header .icons a').tooltip();
  }, 1000);
};

Template.setup_layout.helpers({
  isUpdating: function () {
    return Session.get('isUpdating');
  }
});
