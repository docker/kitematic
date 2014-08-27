Template.dashboard_single_image.rendered = function () {
  Meteor.setInterval(function () {
    $('.btn-icon').tooltip();
  }, 1000);
};

Template.dashboard_single_image.events({
  'click .btn-create-app': function () {
    $('#modal-create-app').modal('show');
    $('#form-create-app').find('input[name="imageId"]').val(this._id);
    $('#image-picker').hide();
  },
  'click .btn-folder': function () {
    var exec = require('child_process').exec;
    exec('open ' + this.originPath, function (err) {
      if (err) { throw err; }
    });
  },
  'click .btn-rebuild': function () {
    $('.btn-icon').tooltip('hide');
    Meteor.call('rebuildImage', this._id, function (err) {
      if (err) { throw err; }
    });
  }
});
