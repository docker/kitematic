var path = require('path');
var fs = require('fs');

Template.modal_create_image.rendered = function () {
  $('#modal-create-image').bind('hidden.bs.modal', function () {
    Router.go('dashboard_images');
  });
};

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
      if (!Util.hasDockerfile(pickedDirectory)) {
        $('#picked-directory-error').html('Only directories with Dockerfiles are supported now.');
        $('#btn-create-image').attr('disabled', 'disabled');
      } else {
        $('#btn-create-image').removeAttr('disabled');
      }
    } else {
      $('#picked-directory').html('');
      $('#btn-create-image').attr('disabled', 'disabled');
    }
  },
  'click #btn-create-image': function () {
    var directory = $('#directory-picker').val();
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
