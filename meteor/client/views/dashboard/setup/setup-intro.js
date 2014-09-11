Template.setup_intro.events({
  'click .continue-button': function (e) {
    Router.go('setup_install');
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
});

