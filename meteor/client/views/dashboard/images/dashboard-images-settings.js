Template.dashboard_images_settings.events({
  'click .btn-delete-image': function () {
    var result = confirm("Are you sure you want to delete this image?");
    if (result === true) {
      var imageId = this._id;
      var image = Images.findOne(imageId);
      var app = Apps.findOne({imageId: imageId});
      if (!app) {
        Images.remove({_id: image._id});
        if (image.docker) {
          Docker.removeImage(image.docker.Id, function (err) {
            if (err) { console.error(err); }
          });
        }
        try {
          Util.deleteFolder(image.path);
        } catch (e) {
          console.error(e);
        }
        Sync.removeAppWatcher(imageId);
        Router.go('dashboard_images');
      } else {
        $('#error-delete-image').html('<small class="error">This image is currently being used by <a href="/apps/' + app.name + '">' + app.name + '</a>.</small>');
        $('#error-delete-image').fadeIn();
      }
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
      if (!Util.hasDockerfile(pickedDirectory)) {
        $('#picked-directory-error').html('Only directories with Dockerfiles are supported now.');
      } else {
        Images.update(imageId, {
          $set: {
            originPath: pickedDirectory
          }
        });
      }
    }
  }
});
