Installs = new Meteor.Collection('installs');

schemaInstalls = new SimpleSchema({

});

Installs.allow({
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

Installs.attachSchema(schemaInstalls);
