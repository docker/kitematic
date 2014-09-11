Template.setup_finish.events({
  'click .finish-button': function (e) {
    var enableDiagnostics = $('.install-diagonistics input').attr('checked') ? true : false;
    Installs.insert({version: Installer.CURRENT_VERSION});
    var settings = Settings.findOne();
    if (!settings) {
      Settings.insert({tracking: enableDiagnostics});
    } else {
      Settings.update(settings._id, {
        $set: {
          tracking: enableDiagnostics
        }
      });
    }
    Router.go('dashboard_apps');
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
});
