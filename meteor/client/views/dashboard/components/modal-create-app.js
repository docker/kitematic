Template.modal_create_app.helpers({
  images: function () {
    return Images.find({status: 'READY'}, {sort: {createdAt: -1}});
  }
});

Template.modal_create_app.events({
  'submit #form-create-app': function (e) {
    var $form = $(e.currentTarget);
    var formData = $form.serializeObject();
    Meteor.call('formCreateApp', formData, function (errors, cleaned) {
      if (errors) {
        clearFormErrors($form);
        showFormErrors($form, errors.details);
      } else {
        clearFormErrors($form);
        Meteor.call('createApp', cleaned, function (err) {
          if (err) { throw err; }
        });
        $('#modal-create-app').bind('hidden.bs.modal', function () {
          $('#slug-create-app-name').html('');
          resetForm($form);
          $('#image-picker').find('.fa-check-square-o').hide();
          $('#image-picker').find('.fa-square-o').show();
          Router.go('dashboard_apps');
        }).modal('hide');
      }
    });
    e.preventDefault();
    e.stopPropagation();
    return false;
  },
  'keyup #form-create-app input[name="name"]': function (e) {
    var $input = $(e.currentTarget);
    var slug = _($input.val()).slugify();
    if (slug) {
      $('#slug-create-app-name').html('Name will be created as: <strong>' + slug + '</strong>');
    } else {
      $('#slug-create-app-name').html('');
    }
  },
  'click .pick-image': function (e) {
    var $btn = $(e.currentTarget);
    $('#form-create-app').find('input[name="imageId"]').val(this._id);
    $('#image-picker').find('.fa-check-square-o').hide();
    $('#image-picker').find('.fa-square-o').show();
    $btn.find('.fa-square-o').hide();
    $btn.find('.fa-check-square-o').show();
  },
  'click .btn-create-image': function () {
    $('#modal-create-app').bind('hidden.bs.modal', function () {
      $('#modal-create-image').modal('show');
    }).modal('hide');
  }
});
