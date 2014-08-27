Template.modal_create_image.rendered = function () {
  $('#modal-create-image').bind('hidden.bs.modal', function () {
    Router.go('dashboard_images');
  });
};

Template.modal_create_image.helpers({
  githubConfig: function () {
    return ServiceConfiguration.configurations.findOne({service: 'github'});
  }
});

Template.modal_create_image.events({
  'click #btn-pick-directory': function () {
    $('#directory-picker').click();
  },
  'change #directory-picker': function (e) {
    var $picker = $(e.currentTarget);
    var pickedDirectory = $picker.val();
    $('#picked-directory-error').html('');
    if (pickedDirectory) {
      $('#picked-directory').html('<strong>' + pickedDirectory + '<strong>');
      Meteor.call('validateDirectory', pickedDirectory, function (err) {
        if (err) {
          $('#picked-directory-error').html(err.reason);
          $('#btn-create-image').attr('disabled', 'disabled');
        } else {
          $('#btn-create-image').removeAttr('disabled');
        }
      });
    } else {
      $('#picked-directory').html('');
      $('#btn-create-image').attr('disabled', 'disabled');
    }
  },
  'click #btn-create-image': function () {
    var pickedDirectory = $('#directory-picker').val();
    $('#directory-picker').val('');
    $('#picked-directory-error').html('');
    $('#picked-directory').html('');
    $('#btn-create-image').attr('disabled', 'disabled');
    $('#modal-create-image').modal('hide');
    Meteor.call('createImage', pickedDirectory);
  }
});
