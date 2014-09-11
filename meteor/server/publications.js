Meteor.publish('apps', function () {
  return Apps.find({}, {sort: {createdAt: -1}});
});

Meteor.publish('images', function () {
  return Images.find({}, {sort: {createdAt: -1}});
});

Meteor.publish('installs', function () {
  return Installs.find();
});

Meteor.publish('settings', function () {
  return Settings.find();
});
