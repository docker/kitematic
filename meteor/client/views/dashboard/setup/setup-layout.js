Template.setup_layout.rendered = function () {
  Meteor.setInterval(function () {
    $('.header .icons a').tooltip();
  }, 1000);
};
