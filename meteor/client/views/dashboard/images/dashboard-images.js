Template.dashboardImages.helpers({
  images: function () {
    return Images.find({}, {sort: {createdAt: -1}});
  }
});
