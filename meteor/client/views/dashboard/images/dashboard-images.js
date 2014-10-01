Template.dashboard_images.helpers({
  images: function () {
    return Images.find({'meta.name': {$ne: 'kite-dns'}}, {sort: {createdAt: -1}});
  }
});
