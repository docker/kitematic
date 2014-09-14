Template.setup_intro.events({
  'click .continue-button': function (e) {
    Router.go('setup_install');
    Installer.run(function (err) {
      if (err) {
        console.log('Setup failed.');
        console.log(err);
      } else {
        Router.go('setup_finish');
      }
    });
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
});
