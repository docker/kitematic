Template.dashboardSingleApp.events({
  'click .btn-view-port': function (e) {
    try {
      var open = require('open');
      e.preventDefault();
      e.stopPropagation();
      var $btn = $(e.currentTarget);
      var url = $btn.attr('href');
      open(url);
    } catch (exception) {
      console.log(exception);
    }
  },
  'click .host-address-wrapper': function (e) {
    e.preventDefault();
    e.stopPropagation();
  }
});