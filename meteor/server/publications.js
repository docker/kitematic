Meteor.publish('apps', function () {
  return Apps.find({}, {sort: {createdAt: -1}});
});

Meteor.publish('images', function () {
  return Images.find({}, {sort: {createdAt: -1}});
});

Meteor.publish('installs', function () {
  return Installs.find({}, {sort: {createdAt: -1}});
});
