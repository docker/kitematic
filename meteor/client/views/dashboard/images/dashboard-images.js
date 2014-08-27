Template.dashboard_images.helpers({
  images: function () {
    return Images.find({}, {sort: {createdAt: -1}});
  }
});
