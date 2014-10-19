var remote = require('remote');
var dialog = remote.require('dialog');

Template.dashboard_images_settings.events({
  'click .btn-delete-image': function () {
    var imageId = this._id;
    dialog.showMessageBox({
      message: 'Are you sure you want to delete this image?',
      buttons: ['Delete', 'Cancel']
    }, function (index) {
      if (index !== 0) {
        return;
      }
      var app = Apps.findOne({imageId: imageId});
      if (!app) {
        ImageUtil.remove(imageId);
        Router.go('dashboard_images');
      } else {
        $('#error-delete-image').html('<small class="error">This image is currently being used by <a href="/apps/' + app.name + '">' + app.name + '</a>.</small>');
        $('#error-delete-image').fadeIn();
      }
    });
  },
  'click #btn-pick-directory': function () {
    var imageId = this._id;
    $('#picked-directory-error').html('');
    dialog.showOpenDialog({properties: ['openDirectory']}, function (filenames) {
     if (!filenames) {
        return;
      }
      var directory = filenames[0];
      if (directory) {
        if (!Util.hasDockerfile(directory)) {
          $('#picked-directory-error').html('Only directories with Dockerfiles are supported now.');
        } else {
          Images.update(imageId, {
            $set: {
              originPath: directory
            }
          });
        }
      }
    });
  }
});
