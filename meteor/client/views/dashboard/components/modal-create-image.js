var path = require('path');
var fs = require('fs');
var remote = require('remote');
var dialog = remote.require('dialog');

Template.modalCreateImage.rendered = function () {
  $('#modal-create-image').bind('hidden.bs.modal', function () {
    Router.go('dashboard_images');
  });
};

Template.modalCreateImage.events({
  'click #btn-pick-directory': function () {
    dialog.showOpenDialog({properties: ['openDirectory']}, function (filenames) {
      if (!filenames) {
        return;
      }
      var directory = filenames[0];
      if (directory) {
        $('#picked-directory').html('<strong>' + directory + '<strong>');
        if (!Util.hasDockerfile(directory)) {
          $('#picked-directory-error').html('Only directories with Dockerfiles are supported now.');
          $('#btn-create-image').attr('disabled', 'disabled');
        } else {
          Session.set('createImagePickedDirectory', directory);
          $('#btn-create-image').removeAttr('disabled');
        }
      } else {
        $('#picked-directory').html('');
        $('#btn-create-image').attr('disabled', 'disabled');
      }
    });
  },
  'click #btn-create-image': function () {
    var directory = Session.get('createImagePickedDirectory');
    if (!directory) {
      return;
    }
    $('#directory-picker').val('');
    $('#picked-directory-error').html('');
    $('#picked-directory').html('');
    $('#btn-create-image').attr('disabled', 'disabled');
    var imageObj = {
      status: 'BUILDING',
      path: directory,
      buildLogs: [],
      createdAt: new Date()
    };
    var imageMetaData = ImageUtil.getMetaData(directory);
    imageObj.meta = imageMetaData;
    imageObj.tags = [imageMetaData.name + ':' + imageMetaData.version];
    var imageId = Images.insert(imageObj);

    $('#modal-create-image').modal('hide');
    $('#modal-create-image').on('hidden.bs.modal', function () {
      Router.go('dashboard_images_logs', {id: imageId});
    });

    if (imageObj.meta.logo) {
      Images.update(imageId, {
        $set: {
          logoPath: path.join(directory, imageObj.meta.logo)
        }
      });
    }
    var image = Images.findOne(imageId);
    ImageUtil.pull(fs.readFileSync(path.join(image.path, 'Dockerfile'), 'utf8'), imageId, function (err) {
      if (err) { throw err; }
      ImageUtil.build(image, function (err) {
        if (err) { console.error(err); }
      });
    });
  }
});
