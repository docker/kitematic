Template.dashboard_images_settings.events({
  'click .btn-delete-image': function () {
    var result = confirm("Are you sure you want to delete this image?");
    if (result === true) {
      Meteor.call('deleteImage', this._id, function (err) {
        if (err) {
          $('#error-delete-image').html('<small class="error">' + err.reason + '</small>');
          $('#error-delete-image').fadeIn();
        } else {
          removeAppWatcher(this._id);
          Router.go('dashboard_images');
        }
      });
    }
  },
  'click #btn-pick-directory': function () {
    $('#directory-picker').click();
  },
  'change #directory-picker': function (e) {
    var imageId = this._id;
    var $picker = $(e.currentTarget);
    var pickedDirectory = $picker.val();
    $('#picked-directory-error').html('');
    if (pickedDirectory) {
      Meteor.call('validateDirectory', pickedDirectory, function (err) {
        if (err) {
          $('#picked-directory-error').html(err.reason);
        } else {
          Meteor.call('changeDirectory', imageId, pickedDirectory, function (err) {
            if (err) { throw err; }
          });
        }
      });
    }
  }
});
