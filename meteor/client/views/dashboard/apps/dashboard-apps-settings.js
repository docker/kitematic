var remote = require('remote');
var dialog = remote.require('dialog');

var getConfigVars = function ($form) {
  var configVars = {};
  $form.find('.env-var-pair').each(function () {
    var envKey = $(this).find('.env-var-key').data('key');
    var envVal = $(this).find('.env-var-value').data('value');
    if (envKey) {
      configVars[envKey] = envVal;
    }
  });
  return configVars;
};

Template.dashboard_apps_settings.events({
  'click .btn-delete-var': function (e) {
    var $button = $(e.currentTarget);
    $button.attr("disabled", "disabled");
    var $form = $button.parents('.form-env-vars');
    var appId = $button.data('app-id');
    var envKey = $button.data('key');
    var configVars = getConfigVars($form);
    delete configVars[envKey];
    AppUtil.configVar(appId, configVars);
    $button.removeAttr('disabled');
  },
  'submit .form-env-vars': function (e) {
    var $form = $(e.currentTarget);
    var appId = this._id;
    var configVars = getConfigVars($form);
    var newKey = $form.find('input[name="env-var-key"]').val().trim();
    var newVal = $form.find('input[name="env-var-value"]').val().trim();
    if (newKey && newVal) {
      configVars[newKey] = newVal;
      AppUtil.configVar(appId, configVars);
      $form.find('input[name="env-var-key"]').val('');
      $form.find('input[name="env-var-value"]').val('');
    }
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  'click .btn-delete-app': function () {
    var appId = this._id;
    dialog.showMessageBox({
      message: 'Are you sure you want to delete this app?',
      buttons: ['Delete', 'Cancel']
    }, function (index) {
      if (index === 0) {
        AppUtil.remove(appId);
        Router.go('dashboard_apps');
      }
    });
  }
});
