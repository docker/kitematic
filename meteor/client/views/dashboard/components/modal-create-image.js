var path = require('path');
var fs = require('fs');
var remote = require('remote');
var dialog = remote.require('dialog');

Template.modal_create_image.rendered = function () {
  $('#modal-create-image').bind('hidden.bs.modal', function () {
    Router.go('dashboard_images');
  });
};

Template.modal_create_image.events({
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
    $('#modal-create-image').modal('hide');
    var imageObj = {
      status: 'BUILDING',
      originPath: directory,
      buildLogs: [],
      createdAt: new Date()
    };
    var imageMetaData = ImageUtil.getMetaData(directory);
    imageObj.meta = imageMetaData;
    imageObj.tags = [imageMetaData.name + ':' + imageMetaData.version];
    var imageId = Images.insert(imageObj);
    var imagePath = path.join(Util.KITE_IMAGES_PATH, imageId);
    Images.update(imageId, {
      $set: {
        path: imagePath
      }
    });
    if (imageObj.meta.logo) {
      Images.update(imageId, {
        $set: {
          logoPath: path.join(imagePath, imageObj.meta.logo)
        }
      });
    }
    var image = Images.findOne(imageId);
    ImageUtil.saveFolder(image.originPath, imageId, function (err) {
      if (err) { console.error(err); }
      ImageUtil.pull(fs.readFileSync(path.join(image.path, 'Dockerfile'), 'utf8'), imageId, function (err) {
        if (err) { throw err; }
        ImageUtil.build(image, function (err) {
          if (err) { console.error(err); }
        });
      });
    });
  }
});
