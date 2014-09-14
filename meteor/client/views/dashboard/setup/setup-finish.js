Template.setup_finish.events({
  'click .finish-button': function (e) {
    var enableDiagnostics = $('.install-diagonistics input').prop('checked');
    var status = enableDiagnostics ? 'on' : 'off';
    ga('send', 'event', 'link', 'click', 'turn ' + status + ' usage analytics');
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
