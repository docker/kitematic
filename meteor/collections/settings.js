Settings = new Meteor.Collection('settings');

Settings.allow({
  'update': function () {
    return true;
  },
  'insert': function () {
    return true;
  },
  'remove': function () {
    return true;
  }
});
