showFormErrors = function ($form, errors) {
  for (var name in errors) {
    if (errors.hasOwnProperty(name)) {
      var firstErrorMessage = errors[name][Object.keys(errors[name])[0]];
      $form.find('[name="' + name + '"]').parents('.form-group').addClass('has-error');
      var message = '<p class="help-block error">' + firstErrorMessage + '</p>';
      $form.find('[name="' + name + '"]').after(message);
    }
  }
};

showFormSuccess = function ($form) {
  $form.find('input').parents('.form-group').addClass('has-success');
};

clearFormErrors = function ($form) {
  $form.find('.form-group.has-error .help-block.error').remove();
  $form.find('.form-group.has-error').removeClass('has-error');
};

resetForm = function ($form) {
  $form.find('input').val('');
};

trackLink = function (trackLabel) {
  if (trackLabel) {
    console.log(trackLabel);
    ga('send', 'event', 'link', 'click', trackLabel);
  }
};
